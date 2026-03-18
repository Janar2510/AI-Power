"""Session store - in-memory (default) or DB-backed (Phase 99)."""

import json
import secrets
from datetime import datetime
from typing import Any, Dict, Optional

# In-memory session store: session_id -> {uid, db, company_id, csrf_token, ...}
_sessions: Dict[str, Dict[str, Any]] = {}


def _get_store() -> str:
    """Get session store type from config."""
    try:
        from core.tools import config
        return config.get_config().get("session_store", "memory")
    except Exception:
        return "memory"


def _get_session_db() -> str:
    """Get database name for session storage."""
    try:
        from core.tools import config
        return config.get_config().get("db_name", "erp")
    except Exception:
        return "erp"


def _ensure_http_session_table(db: str) -> None:
    """Create http_session table if it does not exist."""
    try:
        from core.sql_db import get_cursor
        with get_cursor(db) as cur:
            cur.execute("""
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'http_session'
            """)
            if cur.fetchone():
                return
            cur.execute("""
                CREATE TABLE http_session (
                    sid VARCHAR(255) PRIMARY KEY,
                    data JSONB NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
    except Exception:
        pass


def _generate_csrf_token() -> str:
    """Generate CSRF token (Phase 203)."""
    return secrets.token_urlsafe(32)


def create_session(uid: int, db: str, company_id: Optional[int] = None, lang: Optional[str] = None) -> str:
    """Create session, return session_id."""
    sid = secrets.token_urlsafe(32)
    data = {
        "uid": uid,
        "db": db,
        "company_id": company_id,
        "lang": lang or "en_US",
        "csrf_token": _generate_csrf_token(),
    }
    if _get_store() == "db":
        try:
            session_db = _get_session_db()
            _ensure_http_session_table(session_db)
            from core.sql_db import get_cursor
            with get_cursor(session_db) as cur:
                cur.execute(
                    "INSERT INTO http_session (sid, data) VALUES (%s, %s)",
                    (sid, json.dumps(data)),
                )
        except Exception:
            _sessions[sid] = data
    else:
        _sessions[sid] = data
    return sid


def get_session(sid: str) -> Optional[Dict[str, Any]]:
    """Get session by id."""
    if _get_store() == "db":
        try:
            session_db = _get_session_db()
            from core.sql_db import get_cursor
            with get_cursor(session_db) as cur:
                cur.execute("SELECT data FROM http_session WHERE sid = %s", (sid,))
                row = cur.fetchone()
                if row and row.get("data") is not None:
                    d = row["data"]
                    return d if isinstance(d, dict) else json.loads(str(d))
        except Exception:
            pass
        return None
    return _sessions.get(sid)


def get_session_company_id(sid: str) -> Optional[int]:
    """Get current company_id from session."""
    sess = get_session(sid)
    return sess.get("company_id") if sess else None


def set_session_company_id(sid: str, company_id: int) -> None:
    """Set current company in session."""
    if _get_store() == "db":
        try:
            session_db = _get_session_db()
            sess = get_session(sid)
            if sess:
                sess["company_id"] = company_id
                from core.sql_db import get_cursor
                with get_cursor(session_db) as cur:
                    cur.execute(
                        "UPDATE http_session SET data = %s WHERE sid = %s",
                        (json.dumps(sess), sid),
                    )
        except Exception:
            pass
    elif sid in _sessions:
        _sessions[sid]["company_id"] = company_id


def get_session_lang(sid: str) -> Optional[str]:
    """Get language from session."""
    sess = get_session(sid)
    return sess.get("lang") if sess else None


def set_session_lang(sid: str, lang: str) -> None:
    """Set language in session."""
    if _get_store() == "db":
        try:
            session_db = _get_session_db()
            sess = get_session(sid)
            if sess:
                sess["lang"] = lang or "en_US"
                from core.sql_db import get_cursor
                with get_cursor(session_db) as cur:
                    cur.execute(
                        "UPDATE http_session SET data = %s WHERE sid = %s",
                        (json.dumps(sess), sid),
                    )
        except Exception:
            pass
    elif sid in _sessions:
        _sessions[sid]["lang"] = lang or "en_US"


def ensure_session_csrf(sid: str) -> Optional[str]:
    """Ensure session has csrf_token; return it. Phase 203. Creates if missing for backward compat."""
    sess = get_session(sid)
    if not sess:
        return None
    if "csrf_token" not in sess or not sess["csrf_token"]:
        sess["csrf_token"] = _generate_csrf_token()
        if _get_store() == "db":
            try:
                session_db = _get_session_db()
                from core.sql_db import get_cursor
                with get_cursor(session_db) as cur:
                    cur.execute(
                        "UPDATE http_session SET data = %s WHERE sid = %s",
                        (json.dumps(sess), sid),
                    )
            except Exception:
                pass
        elif sid in _sessions:
            _sessions[sid]["csrf_token"] = sess["csrf_token"]
    return sess.get("csrf_token")


def delete_session(sid: str) -> None:
    """Delete session."""
    if _get_store() == "db":
        try:
            session_db = _get_session_db()
            from core.sql_db import get_cursor
            with get_cursor(session_db) as cur:
                cur.execute("DELETE FROM http_session WHERE sid = %s", (sid,))
        except Exception:
            _sessions.pop(sid, None)
    else:
        _sessions.pop(sid, None)
