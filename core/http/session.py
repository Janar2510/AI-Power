"""Simple session store - in-memory for development."""

import secrets
from typing import Any, Dict, Optional

# In-memory session store: session_id -> {uid, db, ...}
_sessions: Dict[str, Dict[str, Any]] = {}


def create_session(uid: int, db: str) -> str:
    """Create session, return session_id."""
    sid = secrets.token_urlsafe(32)
    _sessions[sid] = {"uid": uid, "db": db}
    return sid


def get_session(sid: str) -> Optional[Dict[str, Any]]:
    """Get session by id."""
    return _sessions.get(sid)


def delete_session(sid: str) -> None:
    """Delete session."""
    _sessions.pop(sid, None)
