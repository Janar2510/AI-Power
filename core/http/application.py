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
def _load_routes():
    import core.http.routes  # noqa: F401
    try:
        import addons.ai_assistant.controllers  # noqa: F401 - registers /ai/tools, /ai/chat
    except ImportError:
        pass

_logger = logging.getLogger("erp.http")

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
