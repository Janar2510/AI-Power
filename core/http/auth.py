"""Authentication - login, session check."""

import logging
import secrets
import time
from typing import Optional, Tuple

# Suppress passlib bcrypt version warning (bcrypt 4.1+ removed __about__)
logging.getLogger("passlib").setLevel(logging.ERROR)

try:
    from passlib.hash import bcrypt
    _HAS_BCRYPT = True
except ImportError:
    _HAS_BCRYPT = False

from werkzeug.wrappers import Response

from core.sql_db import get_cursor
from core.orm import Registry, Environment
from core.orm.models import ModelBase
from core.modules import load_module_graph
from core.tools import config

from .request import Request
from .session import (
    create_session,
    get_session,
    get_session_company_id,
    get_session_allowed_company_ids,
    set_session_company_id,
    set_session_allowed_company_ids,
    get_session_lang,
    set_session_lang,
)

_registries: dict = {}  # dbname -> Registry

# TOTP pending: token -> {uid, db, expires} (Phase 125)
_totp_pending: dict = {}
_TOTP_PENDING_TTL = 300  # 5 minutes

# TOTP setup: sid -> {secret, uid, db, login} (Phase 125)
_totp_setup_store: dict = {}


def user_has_totp_enabled(uid: int, db: str) -> bool:
    """Check if user has TOTP enabled. Returns False if auth_totp not loaded or column missing."""
    try:
        registry = _get_registry(db)
        with get_cursor(db) as cr:
            cr.execute(
                "SELECT totp_enabled FROM res_users WHERE id = %s",
                (uid,),
            )
            row = cr.fetchone()
            if row:
                val = row.get("totp_enabled") if hasattr(row, "get") else row[0]
                return bool(val)
    except Exception:
        pass
    return False


def create_totp_pending(uid: int, db: str) -> str:
    """Create pending TOTP verification token. Returns token."""
    token = secrets.token_urlsafe(32)
    _totp_pending[token] = {"uid": uid, "db": db, "expires": time.time() + _TOTP_PENDING_TTL}
    return token


def get_totp_pending(token: str) -> Optional[Tuple[int, str]]:
    """Get (uid, db) for valid pending token, or None. Clears expired entries."""
    if not token:
        return None
    now = time.time()
    for k, v in list(_totp_pending.items()):
        if v.get("expires", 0) < now:
            del _totp_pending[k]
    p = _totp_pending.get(token)
    if not p or p.get("expires", 0) < now:
        return None
    return (p["uid"], p["db"])


def clear_totp_pending(token: str) -> None:
    """Remove pending token."""
    _totp_pending.pop(token, None)


def generate_totp_secret() -> Optional[str]:
    """Generate a new TOTP secret. Returns None if pyotp not installed."""
    try:
        import pyotp
        return pyotp.random_base32()
    except ImportError:
        return None


def get_totp_provision_uri(secret: str, login: str, issuer: str = "ERP Platform") -> Optional[str]:
    """Get otpauth URI for QR code. Returns None if pyotp not installed."""
    try:
        import pyotp
        return pyotp.totp.TOTP(secret).provisioning_uri(name=login, issuer_name=issuer)
    except ImportError:
        return None


def verify_totp_code(uid: int, db: str, code: str, secret: Optional[str] = None) -> bool:
    """Verify TOTP code. If secret provided, use it; else load from user. Requires pyotp."""
    try:
        import pyotp
    except ImportError:
        return False
    try:
        if not secret:
            registry = _get_registry(db)
            with get_cursor(db) as cr:
                cr.execute("SELECT totp_secret FROM res_users WHERE id = %s", (uid,))
                row = cr.fetchone()
                if not row:
                    return False
                secret = row.get("totp_secret") if hasattr(row, "get") else row[0]
        if not secret:
            return False
        totp = pyotp.TOTP(secret)
        return totp.verify(code, valid_window=1)
    except Exception:
        return False


def save_totp_to_user(uid: int, db: str, secret: str) -> bool:
    """Save TOTP secret to user and enable. Returns True on success."""
    try:
        registry = _get_registry(db)
        with get_cursor(db) as cr:
            cr.execute(
                "UPDATE res_users SET totp_secret = %s, totp_enabled = TRUE WHERE id = %s",
                (secret, uid),
            )
        return True
    except Exception:
        return False


def store_totp_setup(sid: str, secret: str, uid: int, db: str, login: str) -> None:
    """Store TOTP setup state for session."""
    _totp_setup_store[sid] = {"secret": secret, "uid": uid, "db": db, "login": login}


def get_totp_setup(sid: str) -> Optional[dict]:
    """Get TOTP setup state. Returns None if not found."""
    return _totp_setup_store.get(sid)


def clear_totp_setup(sid: str) -> None:
    """Clear TOTP setup state."""
    _totp_setup_store.pop(sid, None)


def disable_totp_for_user(uid: int, db: str) -> bool:
    """Disable TOTP for user. Returns True on success."""
    try:
        with get_cursor(db) as cr:
            cr.execute(
                "UPDATE res_users SET totp_secret = NULL, totp_enabled = FALSE WHERE id = %s",
                (uid,),
            )
        return True
    except Exception:
        return False


def hash_password(plain: str) -> str:
    """Hash password for storage."""
    if _HAS_BCRYPT:
        return bcrypt.hash(plain)
    return plain  # fallback: store plain (insecure)


def verify_password(plain: str, stored: str) -> bool:
    """Verify plain password against stored (hash or legacy plain)."""
    if stored is None or not str(stored):
        return False
    stored = str(stored)
    if _HAS_BCRYPT and stored.startswith("$2") and len(stored) > 20:
        return bcrypt.verify(plain, stored)
    return plain == stored


def _get_registry(dbname: str) -> Registry:
    """Get or create registry for database."""
    cached = _registries.get(dbname)
    if cached is not None and cached.keys():
        return cached
    if cached is not None and not cached.keys():
        _registries.pop(dbname, None)
    if dbname not in _registries:
        # Do NOT call parse_config(["--addons-path=addons"]) here: it replaces the
        # entire global config and resolves "addons" relative to cwd. Wrong cwd
        # → no modules discovered → empty registry → call_kw "Available: []".
        # Server startup already ran parse_config; otherwise get_addons_paths()
        # falls back to addons/ next to core/tools/config.py.
        reg = Registry(dbname)
        ModelBase._registry = reg
        # Clear addon modules so they reload with this registry (avoids stale
        # classes from prior load_module_graph runs without a registry)
        import sys
        to_clear = [k for k in list(sys.modules) if k.startswith("addons.")]
        for k in to_clear:
            del sys.modules[k]
        load_module_graph()
        _registries[dbname] = reg
    return _registries[dbname]


def authenticate(login: str, password: str, db: str) -> Optional[int]:
    """Authenticate user. Returns uid or None."""
    registry = _get_registry(db)
    with get_cursor(db) as cr:
        env = Environment(registry, cr=cr, uid=0)
        registry.set_env(env)
        User = env.get("res.users")
        uid = None
        if User is not None:
            users = User.search([("login", "=", login)])
            if not users:
                return None
            uid = users.ids[0]
        else:
            # Fallback for partially initialized registries: use SQL lookup.
            cr.execute("SELECT id FROM res_users WHERE login = %s ORDER BY id LIMIT 1", (login,))
            row_uid = cr.fetchone()
            if not row_uid:
                return None
            uid = row_uid.get("id") if hasattr(row_uid, "get") else row_uid[0]
            if not uid:
                return None
        # Simple password check - direct SQL to avoid ORM read cursor issues
        cr.execute(
            "SELECT password FROM res_users WHERE id = %s",
            (uid,),
        )
        row = cr.fetchone()
        if not row:
            return None
        pwd = row.get("password") if hasattr(row, "get") else row[0]
        if not verify_password(password, pwd or ""):
            return None
        return uid


def get_session_uid(request: Request) -> Optional[int]:
    """Get uid from session cookie."""
    sid = request.cookies.get("erp_session")
    if not sid:
        return None
    sess = get_session(sid)
    return sess.get("uid") if sess else None


def get_session_db(request: Request) -> str:
    """Get db from session or config default."""
    sid = request.cookies.get("erp_session")
    if sid:
        sess = get_session(sid)
        if sess:
            return sess.get("db", config.get_config().get("db_name", "erp"))
    return config.get_config().get("db_name", "erp")


def get_session_company_id_from_request(request: Request) -> Optional[int]:
    """Get current company_id from session."""
    sid = request.cookies.get("erp_session")
    if not sid:
        return None
    return get_session_company_id(sid)


def get_session_allowed_company_ids_from_request(request: Request) -> list[int]:
    """Get allowed company ids from session."""
    sid = request.cookies.get("erp_session")
    if not sid:
        return []
    return get_session_allowed_company_ids(sid)


def get_session_lang_from_request(request: Request) -> str:
    """Get language from session. Default en_US."""
    sid = request.cookies.get("erp_session")
    if not sid:
        return "en_US"
    return get_session_lang(sid) or "en_US"


def _get_user_company_id(uid: int, db: str) -> Optional[int]:
    """Get user's company_id (current company) for session init."""
    try:
        registry = _get_registry(db)
        with get_cursor(db) as cr:
            env = Environment(registry, cr=cr, uid=uid)
            registry.set_env(env)
            User = env["res.users"]
            rows = User.read_ids([uid], ["company_id"])
            if rows and rows[0].get("company_id"):
                return rows[0]["company_id"]
            # Fallback: first company
            Company = env.get("res.company")
            if Company:
                companies = Company.search([], limit=1)
                if companies and companies.ids:
                    return companies.ids[0]
    except Exception:
        pass
    return None


def login_response(uid: int, db: str, redirect_to: str = "/") -> Response:
    """Create response with session cookie (redirect)."""
    company_id = _get_user_company_id(uid, db)
    sid = create_session(uid, db, company_id)
    resp = Response(status=302, headers={"Location": redirect_to})
    resp.set_cookie("erp_session", sid, httponly=True, samesite="Lax", path="/")
    return resp


def login_response_with_html(uid: int, db: str, html: str) -> Response:
    """Create response with session cookie and HTML body (no redirect).
    Avoids Safari/browser issues with cookie not being sent on 302 redirect."""
    company_id = _get_user_company_id(uid, db)
    sid = create_session(uid, db, company_id)
    resp = Response(html, content_type="text/html; charset=utf-8")
    resp.set_cookie("erp_session", sid, httponly=True, samesite="Lax", path="/")
    return resp


def logout_response() -> Response:
    """Create response that clears session."""
    resp = Response(status=302, headers={"Location": "/web/login"})
    resp.delete_cookie("erp_session", path="/")
    return resp
