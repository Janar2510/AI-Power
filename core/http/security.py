"""Phase 203: CSRF protection, rate limiting, security headers."""

import logging
import secrets
import time
from collections import defaultdict
from typing import Callable, Optional, Set, Tuple

from werkzeug.wrappers import Response

_logger = logging.getLogger("erp.security")

# --- CSRF ---

# Paths that skip CSRF (login before session, payment callbacks, Bearer-only APIs, session bootstrap)
CSRF_EXEMPT_PATHS: Set[str] = {
    "/web/login",
    "/web/login/totp",
    "/web/signup",
    "/web/session/get_session_info",  # bootstrap: returns csrf_token
    "/payment/process",
    "/payment/status",
    "/payment/callback",
    "/health",
    "/readiness",
}


def _path_exempt(path: str) -> bool:
    """True if path is CSRF-exempt."""
    if path in CSRF_EXEMPT_PATHS:
        return True
    if path.startswith("/payment/"):
        return True
    if path.startswith("/json/2/"):
        return True
    if path.startswith("/api/v1/"):
        return True
    return False


def generate_csrf_token() -> str:
    """Generate a new CSRF token."""
    return secrets.token_urlsafe(32)


def validate_csrf(request, token_from_session: Optional[str]) -> Tuple[bool, Optional[str]]:
    """
    Validate CSRF token. Returns (valid, error_message).
    Exempt: Bearer auth, GET/HEAD/OPTIONS, exempt paths.
    """
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return True, None
    if _path_exempt(request.path):
        return True, None
    auth = request.headers.get("Authorization", "")
    if auth.lower().startswith("bearer "):
        return True, None
    if not token_from_session:
        return False, "CSRF token missing (no session)"
    provided = (
        request.headers.get("X-CSRF-Token")
        or (request.form.get("csrf_token") if request.form else None)
        or (request.get_json(silent=True) or {}).get("csrf_token")
    )
    if not provided or not secrets.compare_digest(provided, token_from_session):
        return False, "Invalid CSRF token"
    return True, None


# --- Rate limiting ---

# Sliding window: key -> [(timestamp, ...), ...]
_rate_store: dict = {}
_RATE_CLEANUP_INTERVAL = 60  # seconds
_last_cleanup = 0.0

# Default limits: (requests_per_window, window_seconds)
RATE_LIMITS = {
    "/web/login": (5, 60),
    "/web/login/totp": (5, 60),
    "/web/signup": (3, 60),
    "/ai/chat": (30, 60),  # Phase D2: LLM-heavy endpoint
    "/ai/nl_search": (40, 60),
    "/ai/extract_fields": (40, 60),
    "default": (120, 60),  # 120 req/min for general API
}


def _get_client_key(request) -> str:
    """Get client identifier for rate limiting (IP + optional X-Forwarded-For)."""
    forwarded = request.headers.get("X-Forwarded-For", "").strip()
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.remote_addr or "unknown"


def _cleanup_rate_store():
    """Remove expired entries from rate store."""
    global _last_cleanup
    now = time.time()
    if now - _last_cleanup < _RATE_CLEANUP_INTERVAL:
        return
    _last_cleanup = now
    window = 300  # keep 5 min of history
    for key in list(_rate_store.keys()):
        times = _rate_store[key]
        _rate_store[key] = [t for t in times if now - t < window]
        if not _rate_store[key]:
            del _rate_store[key]


def check_rate_limit(request, path: Optional[str] = None) -> Tuple[bool, Optional[int]]:
    """
    Check rate limit. Returns (allowed, retry_after_seconds).
    retry_after_seconds is set when rate limited.
    """
    _cleanup_rate_store()
    path = path or request.path
    limit, window = RATE_LIMITS.get(path, RATE_LIMITS["default"])
    key = f"{_get_client_key(request)}:{path}"
    now = time.time()
    cutoff = now - window
    if key not in _rate_store:
        _rate_store[key] = []
    times = _rate_store[key]
    times = [t for t in times if t > cutoff]
    if len(times) >= limit:
        oldest = min(times)
        retry_after = int(window - (now - oldest)) + 1
        return False, max(1, retry_after)
    times.append(now)
    _rate_store[key] = times
    return True, None


# --- Security headers ---

# Enforcing CSP only — Report-Only without report-to triggers browser console noise and has no effect.
SECURITY_HEADERS = [
    ("X-Content-Type-Options", "nosniff"),
    ("X-Frame-Options", "DENY"),
    ("Referrer-Policy", "strict-origin-when-cross-origin"),
    (
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
        "connect-src 'self'; "
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: blob:; "
        "font-src 'self' https://cdn.jsdelivr.net;",
    ),
]

# Alias for callers expecting CSP_HEADERS (same list as SECURITY_HEADERS).
CSP_HEADERS = SECURITY_HEADERS


def get_security_headers(use_report_only_csp: bool = False) -> list:
    """Return standard security headers (enforcing CSP). use_report_only_csp is ignored."""
    return list(SECURITY_HEADERS)
