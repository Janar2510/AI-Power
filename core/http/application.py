"""WSGI application and dispatcher."""

import json
import logging
import re
from pathlib import Path
from typing import Any, Callable, Optional

from werkzeug.wrappers import Request as WRequest, Response
from werkzeug.routing import Map, Rule
from werkzeug.exceptions import NotFound

from core.tools import config

from core.modules.assets import get_bundle_content

from .controller import _ROUTES
from .request import Request
from .rpc import dispatch_jsonrpc
from .json2 import dispatch_json2, JSON2_RE
from .report import handle_report

# Load default routes (after all imports to avoid circular import)
_websocket_handler = None


def _load_routes():
    global _websocket_handler
    import core.http.routes  # noqa: F401
    try:
        import addons.ai_assistant.controllers  # noqa: F401 - registers /ai/tools, /ai/chat
    except ImportError:
        pass
    try:
        import addons.bus.controllers  # noqa: F401 - registers /longpolling/poll
        from addons.bus.controllers.bus_controller import _handle_websocket
        _websocket_handler = _handle_websocket
    except ImportError:
        pass
    try:
        import addons.website.controllers  # noqa: F401 - registers /website, /my, /my/leads, /my/profile
    except ImportError:
        pass

_logger = logging.getLogger("erp.http")

# Security headers (Phase 99)
_SECURITY_HEADERS = [
    ("X-Frame-Options", "SAMEORIGIN"),
    ("X-Content-Type-Options", "nosniff"),
    ("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: blob:; font-src 'self' https://cdn.jsdelivr.net;"),
]


def _needs_cors(path: str) -> bool:
    """True if path is an API endpoint that uses fetch with credentials (needs CORS)."""
    return (
        "/json/2/" in path or path == "/jsonrpc" or path.startswith("/web/dataset/")
        or path == "/web/session/get_session_info" or path == "/web/load_views"
        or path.startswith("/web/translations") or path.startswith("/web/session/")
    )


def _is_safe_local_origin(origin: str) -> bool:
    """Allow localhost/127.0.0.1 origins for dev (Cursor embedded browser, etc.)."""
    if not origin or not isinstance(origin, str):
        return False
    try:
        from urllib.parse import urlparse
        p = urlparse(origin)
        host = (p.hostname or "").lower()
        return host in ("localhost", "127.0.0.1", "::1")
    except Exception:
        return False


def _add_security_headers(start_response: Callable, environ: dict) -> Callable:
    """Wrap start_response to add security headers to every response."""
    proxy_mode = config.get_config().get("proxy_mode", False)
    cors_origin = config.get_config().get("cors_origin", "")
    path = environ.get("PATH_INFO") or ""
    method = environ.get("REQUEST_METHOD", "")

    def custom_start_response(status, headers, exc_info=None):
        for name, value in _SECURITY_HEADERS:
            headers.append((name, value))
        if proxy_mode:
            headers.append(("Strict-Transport-Security", "max-age=31536000; includeSubDomains"))
        # CORS: cors_origin > same-host reflect > safe local origin (localhost/127.0.0.1)
        origin = cors_origin
        if not origin and _needs_cors(path):
            req_origin = environ.get("HTTP_ORIGIN", "")
            req_host = environ.get("HTTP_HOST", "")
            if req_origin and req_host and (
                req_origin == "http://" + req_host or req_origin == "https://" + req_host
            ):
                origin = req_origin
            elif req_origin and _is_safe_local_origin(req_origin):
                origin = req_origin
        if origin and _needs_cors(path):
            headers.append(("Access-Control-Allow-Origin", origin))
            headers.append(("Access-Control-Allow-Credentials", "true"))
            if method == "OPTIONS":
                headers.append(("Access-Control-Allow-Methods", "POST, OPTIONS"))
                headers.append(("Access-Control-Allow-Headers", "Content-Type"))
                headers.append(("Access-Control-Max-Age", "86400"))
        return start_response(status, headers, exc_info)

    return custom_start_response


# Static path: /<module>/static/<path>
STATIC_RE = re.compile(r"^/([a-z0-9_]+)/static/(.+)$")
# Asset bundle: /web/assets/<bundle_id>.<css|js>
ASSET_RE = re.compile(r"^/web/assets/([a-z0-9_.]+)\.(css|js)$")


def _serve_asset_bundle(bundle_id: str, ext: str) -> Optional[Response]:
    """Serve concatenated asset bundle."""
    try:
        content, mimetype = get_bundle_content(bundle_id, ext)
        return Response(content, mimetype=mimetype)
    except Exception:
        return None


def _serve_static(module: str, path: str) -> Optional[Response]:
    """Serve static file from module's static/ directory."""
    for addons_dir in config.get_addons_paths():
        static_path = addons_dir / module / "static" / path
        if static_path.exists() and static_path.is_file():
            try:
                return Response(
                    static_path.read_bytes(),
                    mimetype=_guess_mimetype(path),
                )
            except OSError:
                pass
    return None


def _guess_mimetype(path: str) -> str:
    """Guess MIME type from path."""
    if path is None:
        return "application/octet-stream"
    ext = path.rsplit(".", 1)[-1].lower() if "." in path else ""
    mime = {
        "js": "application/javascript",
        "css": "text/css",
        "html": "text/html",
        "json": "application/json",
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "svg": "image/svg+xml",
        "ico": "image/x-icon",
    }
    return mime.get(ext, "application/octet-stream")


def _match_route(path: str, method: str) -> Optional[tuple]:
    """Match path and method to a route. Returns (endpoint, kwargs) or None."""
    for route_path, route_info in _ROUTES.items():
        if method not in route_info["methods"]:
            continue
        # Simple exact match for MVP
        if route_path == path:
            return (route_info["endpoint"], {})
    return None


class Application:
    """WSGI application."""

    def __init__(self):
        _load_routes()

    def __call__(self, environ: dict, start_response: Callable):
        request = Request(environ)
        # WebSocket: use raw start_response (simple-websocket needs it; wrapping causes "write() before start_response")
        if request.path == "/websocket/" and request.method == "GET":
            upgrade = environ.get("HTTP_UPGRADE", "").lower()
            if "websocket" in upgrade and _websocket_handler:
                return _websocket_handler(environ, start_response)
        start_response = _add_security_headers(start_response, environ)

        # Report routes: /report/html/<name>/<ids> or /report/pdf/<name>/<ids>
        if request.path.startswith("/report/") and request.method == "GET":
            resp = handle_report(request)
            if resp is not None:
                return resp(environ, start_response)

        # Route dispatch first for /web/ API paths (before static to avoid 404)
        match = _match_route(request.path, request.method)
        if match:
            endpoint, kwargs = match
            try:
                result = endpoint(request, **kwargs)
                if isinstance(result, Response):
                    return result(environ, start_response)
                if isinstance(result, str):
                    return Response(result)(environ, start_response)
                return Response(str(result))(environ, start_response)
            except Exception as e:
                _logger.exception("Route error: %s", e)
                return Response(str(e), status=500)(environ, start_response)

        # Asset bundles (before static)
        m_asset = ASSET_RE.match(request.path)
        if m_asset:
            resp = _serve_asset_bundle(m_asset.group(1), m_asset.group(2))
            if resp:
                return resp(environ, start_response)
            return NotFound()(environ, start_response)

        # Static files
        m = STATIC_RE.match(request.path)
        if m:
            resp = _serve_static(m.group(1), m.group(2))
            if resp:
                return resp(environ, start_response)
            return NotFound()(environ, start_response)

        # OPTIONS preflight for API paths (CORS: POST/fetch with credentials triggers preflight)
        if request.method == "OPTIONS" and _needs_cors(request.path):
            return Response(status=204)(environ, start_response)

        # jsonrpc (session-aware): /jsonrpc or /web/dataset/call_kw[/model.method]
        if request.method == "POST" and (
            request.path == "/jsonrpc" or request.path == "/web/dataset/call_kw" or
            request.path.startswith("/web/dataset/call_kw/")
        ):
            resp = dispatch_jsonrpc(request)
            return resp(environ, start_response)

        # External JSON-2 API: /json/2/<model>/<method>
        if request.method == "POST" and JSON2_RE.match(request.path):
            resp = dispatch_json2(request)
            return resp(environ, start_response)

        return NotFound()(environ, start_response)
