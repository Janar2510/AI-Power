"""External JSON-2 API - Odoo 19 parity. Token-based auth, /json/2/<model>/<method>."""

import json
import logging
import os
import re

from werkzeug.wrappers import Response

from core.sql_db import get_cursor
from core.orm import Environment
from core.http.request import Request
from core.http.auth import _get_registry
from core.http.rpc import _call_kw, _get_access_map, _op_for_method
from core.orm.security import check_access

_logger = logging.getLogger("erp.json2")

# Path: /json/2/<model>/<method>
JSON2_RE = re.compile(r"^/json/2/([a-z0-9_.]+)/([a-z0-9_]+)$")


def _get_api_key() -> str:
    """API key from env or config. Fallback when no DB key matches."""
    from core.tools import config
    return config.get_config().get("api_key", "") or os.environ.get("API_KEY", "")


def _auth_bearer(request: Request):
    """Validate Authorization: bearer <token>. Returns (uid, db) or (None, None).
    Checks res.users.apikeys first, then falls back to env API_KEY.
    """
    auth = request.headers.get("Authorization", "")
    if not auth.lower().startswith("bearer "):
        return None, None
    token = auth[7:].strip()
    if not token:
        return None, None
    db = request.headers.get("X-Odoo-Database", "").strip() or os.environ.get("PGDATABASE", "erp")
    try:
        registry = _get_registry(db)
        with get_cursor(db) as cr:
            env = Environment(registry, cr=cr, uid=1)
            ApiKeys = env.get("res.users.apikeys")
            if ApiKeys:
                uid = ApiKeys._check_credentials(env, token)
                if uid is not None:
                    return uid, db
    except Exception:
        pass
    api_key = _get_api_key()
    if api_key and token == api_key:
        return 1, db
    return None, None


def _error_response(message: str, status: int = 401) -> Response:
    """Return JSON error in Odoo 19 format."""
    body = json.dumps({
        "name": "werkzeug.exceptions.Unauthorized" if status == 401 else "Exception",
        "message": message,
        "arguments": [message, status],
        "context": {},
        "debug": "",
    })
    return Response(body, status=status, content_type="application/json; charset=utf-8")


def dispatch_json2(request: Request) -> Response:
    """Handle POST /json/2/<model>/<method>. Odoo 19 JSON-2 contract."""
    if request.method != "POST":
        return _error_response("Method not allowed", 405)

    m = JSON2_RE.match(request.path)
    if not m:
        return _error_response("Invalid path", 404)

    model_name, method_name = m.group(1), m.group(2)
    uid, db = _auth_bearer(request)
    if uid is None:
        return _error_response("Invalid apikey", 401)

    try:
        data = request.get_json() or {}
    except Exception:
        return _error_response("Invalid JSON", 400)

    ids = data.get("ids", [])
    context = data.get("context", {})
    kwargs = {k: v for k, v in data.items() if k not in ("ids", "context")}

    if method_name == "search":
        args = [kwargs.pop("domain", [])]
    elif method_name == "search_read":
        args = [kwargs.pop("domain", [])]
        kwargs.setdefault("fields", ["name", "id"])
    elif method_name == "read":
        args = [ids, kwargs.pop("fields", ["name", "id"])]
    elif method_name == "create":
        vals = kwargs.pop("vals", kwargs)
        args = [vals] if isinstance(vals, dict) else [vals[0] if vals else {}]
    elif method_name == "write":
        vals = {k: v for k, v in kwargs.items() if k not in ("ids",)}
        args = [ids, vals]
        kwargs = {}
    elif method_name == "unlink":
        args = [ids]
        kwargs = {}
    else:
        args = [ids] if ids else []
        kwargs = kwargs

    op = _op_for_method(method_name)
    if not check_access(_get_access_map(), model_name, op, user_groups=set()):
        return _error_response("Access denied", 403)

    try:
        result = _call_kw(uid, db, model_name, method_name, args, kwargs)
        from core.orm.models import Recordset, ModelBase
        if isinstance(result, Recordset):
            result = result.ids
        elif isinstance(result, ModelBase):
            result = result._ids[0] if result._ids else None
        return Response(
            json.dumps(result),
            content_type="application/json; charset=utf-8",
        )
    except ValueError as e:
        return _error_response(str(e), 400)
    except Exception as e:
        _logger.exception("JSON-2 error: %s", e)
        return _error_response(str(e), 500)
