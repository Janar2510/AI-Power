"""Authentication - login, session check."""

from typing import Optional, Tuple

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
    set_session_company_id,
    get_session_lang,
    set_session_lang,
)

_registries: dict = {}  # dbname -> Registry


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
    if dbname not in _registries:
        config.parse_config(["--addons-path=addons"])
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
        User = env["res.users"]
        users = User.search([("login", "=", login)])
        if not users:
            return None
        uid = users.ids[0]
        # Simple password check - direct SQL to avoid ORM read cursor issues
        cr.execute(
            'SELECT password FROM res_users WHERE id = %s',
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
