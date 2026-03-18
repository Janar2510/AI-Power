"""REST API v1 - /api/v1/<model> with GET/POST/PUT/DELETE (Phase 208)."""

import json
import logging
import os
import re

from werkzeug.wrappers import Response

from core.sql_db import get_cursor
from core.orm import Environment
from core.http.request import Request
from core.http.auth import _get_registry
from core.http.json2 import _auth_bearer, _error_response
from core.http.rpc import _call_kw, _get_access_map, _op_for_method
from core.orm.security import check_access, get_user_groups

_logger = logging.getLogger("erp.rest")

# /api/v1/<model> or /api/v1/<model>/<id>
REST_RE = re.compile(r"^/api/v1/([a-z0-9_.]+)(?:/(\d+))?$")


def _rest_response(data: dict, status: int = 200) -> Response:
    """Return JSON response with consistent envelope."""
    return Response(
        json.dumps(data),
        status=status,
        content_type="application/json; charset=utf-8",
    )


def _parse_domain(s: str) -> list:
    """Parse domain from query string (JSON)."""
    if not s or not s.strip():
        return []
    try:
        d = json.loads(s)
        return d if isinstance(d, list) else []
    except json.JSONDecodeError:
        return []


def _parse_fields(s: str) -> list:
    """Parse fields from query string (comma-separated or JSON array)."""
    if not s or not s.strip():
        return ["id", "name", "display_name"]
    s = s.strip()
    if s.startswith("["):
        try:
            f = json.loads(s)
            return f if isinstance(f, list) else [s]
        except json.JSONDecodeError:
            return [x.strip() for x in s.split(",") if x.strip()]
    return [x.strip() for x in s.split(",") if x.strip()]


def dispatch_rest(request: Request) -> Response:
    """Handle REST API /api/v1/<model> and /api/v1/<model>/<id>."""
    m = REST_RE.match(request.path)
    if not m:
        return _error_response("Not found", 404)

    model_name, id_str = m.group(1), m.group(2)
    uid, db = _auth_bearer(request)
    if uid is None:
        return _error_response("Invalid apikey", 401)

    registry = _get_registry(db)
    user_groups = get_user_groups(registry, db, uid) if uid else set()

    # GET: list or read
    if request.method == "GET":
        if id_str:
            rid = int(id_str)
            op = "read"
            if not check_access(_get_access_map(), model_name, op, user_groups=user_groups):
                return _error_response("Access denied", 403)
            try:
                with get_cursor(db) as cr:
                    env = Environment(registry, cr=cr, uid=uid)
                    registry.set_env(env)
                    Model = env.get(model_name)
                    if not Model:
                        return _error_response("Model not found", 404)
                    fields = _parse_fields(request.args.get("fields", "id,name,display_name"))
                    rows = Model.browse(rid).read(fields)
                    if not rows:
                        return _error_response("Not found", 404)
                    return _rest_response({"data": rows[0] if len(rows) == 1 else rows})
            except ValueError as e:
                return _error_response(str(e), 400)
            except Exception as e:
                _logger.exception("REST read error: %s", e)
                return _error_response(str(e), 500)
        else:
            op = "read"
            if not check_access(_get_access_map(), model_name, op, user_groups=user_groups):
                return _error_response("Access denied", 403)
            domain = _parse_domain(request.args.get("domain", "[]"))
            fields = _parse_fields(request.args.get("fields", "id,name,display_name"))
            limit = min(int(request.args.get("limit", 80)), 200)
            offset = max(0, int(request.args.get("offset", 0)))
            order = request.args.get("order", "id")
            try:
                with get_cursor(db) as cr:
                    env = Environment(registry, cr=cr, uid=uid)
                    registry.set_env(env)
                    Model = env.get(model_name)
                    if not Model:
                        return _error_response("Model not found", 404)
                    recs = Model.search(domain, limit=limit, offset=offset, order=order)
                    total = Model.search_count(domain)
                    rows = recs.read(fields) if recs else []
                    return _rest_response({"data": rows, "total": total, "offset": offset})
            except Exception as e:
                _logger.exception("REST list error: %s", e)
                return _error_response(str(e), 500)

    # POST: create
    if request.method == "POST" and not id_str:
        op = "create"
        if not check_access(_get_access_map(), model_name, op, user_groups=user_groups):
            return _error_response("Access denied", 403)
        try:
            data = request.get_json() or {}
        except Exception:
            return _error_response("Invalid JSON", 400)
        try:
            result = _call_kw(uid, db, model_name, "create", [data], {})
            from core.orm.models import ModelBase
            rid = result._ids[0] if hasattr(result, "_ids") and result._ids else (result.id if hasattr(result, "id") else result)
            return _rest_response({"data": {"id": rid}}, 201)
        except Exception as e:
            _logger.exception("REST create error: %s", e)
            return _error_response(str(e), 500)

    # PUT: update
    if request.method == "PUT" and id_str:
        op = "write"
        if not check_access(_get_access_map(), model_name, op, user_groups=user_groups):
            return _error_response("Access denied", 403)
        try:
            data = request.get_json() or {}
        except Exception:
            return _error_response("Invalid JSON", 400)
        try:
            rid = int(id_str)
            _call_kw(uid, db, model_name, "write", [[rid], data], {})
            return _rest_response({"data": {"id": rid}})
        except Exception as e:
            _logger.exception("REST update error: %s", e)
            return _error_response(str(e), 500)

    # DELETE: unlink
    if request.method == "DELETE" and id_str:
        op = "unlink"
        if not check_access(_get_access_map(), model_name, op, user_groups=user_groups):
            return _error_response("Access denied", 403)
        try:
            rid = int(id_str)
            _call_kw(uid, db, model_name, "unlink", [[rid]], {})
            return Response(status=204)
        except Exception as e:
            _logger.exception("REST delete error: %s", e)
            return _error_response(str(e), 500)

    return _error_response("Method not allowed", 405)


def _build_openapi_spec(registry) -> dict:
    """Build OpenAPI 3.0 spec from model introspection."""
    models = {}
    for name, Model in getattr(registry, "_models", {}).items():
        props = {}
        for fname in dir(Model):
            if fname.startswith("_"):
                continue
            f = getattr(Model, fname, None)
            if f is None:
                continue
            t = getattr(f, "type", "")
            if t == "char" or t == "text":
                props[fname] = {"type": "string"}
            elif t == "integer":
                props[fname] = {"type": "integer"}
            elif t == "float" or t == "monetary":
                props[fname] = {"type": "number"}
            elif t == "boolean":
                props[fname] = {"type": "boolean"}
            elif t == "datetime" or t == "date":
                props[fname] = {"type": "string", "format": "date-time" if t == "datetime" else "date"}
            elif t == "many2one":
                props[fname] = {"type": "integer", "description": f"FK to {getattr(f, 'comodel', '')}"}
            elif t:
                props[fname] = {"type": "string"}
        if props:
            models[name] = {"type": "object", "properties": props}
    return {
        "openapi": "3.0.0",
        "info": {"title": "ERP REST API", "version": "1.0"},
        "paths": {
            "/api/v1/{model}": {
                "get": {
                    "summary": "List records",
                    "parameters": [
                        {"name": "model", "in": "path", "required": True, "schema": {"type": "string"}},
                        {"name": "domain", "in": "query", "schema": {"type": "string"}},
                        {"name": "fields", "in": "query", "schema": {"type": "string"}},
                        {"name": "limit", "in": "query", "schema": {"type": "integer"}},
                        {"name": "offset", "in": "query", "schema": {"type": "integer"}},
                        {"name": "order", "in": "query", "schema": {"type": "string"}},
                    ],
                    "responses": {"200": {"description": "List of records"}},
                    "security": [{"bearerAuth": []}],
                },
                "post": {
                    "summary": "Create record",
                    "parameters": [{"name": "model", "in": "path", "required": True, "schema": {"type": "string"}}],
                    "requestBody": {"content": {"application/json": {"schema": {"type": "object"}}}},
                    "responses": {"201": {"description": "Created"}},
                    "security": [{"bearerAuth": []}],
                },
            },
            "/api/v1/{model}/{id}": {
                "get": {
                    "summary": "Read record",
                    "parameters": [
                        {"name": "model", "in": "path", "required": True, "schema": {"type": "string"}},
                        {"name": "id", "in": "path", "required": True, "schema": {"type": "integer"}},
                        {"name": "fields", "in": "query", "schema": {"type": "string"}},
                    ],
                    "responses": {"200": {"description": "Record"}},
                    "security": [{"bearerAuth": []}],
                },
                "put": {
                    "summary": "Update record",
                    "parameters": [
                        {"name": "model", "in": "path", "required": True, "schema": {"type": "string"}},
                        {"name": "id", "in": "path", "required": True, "schema": {"type": "integer"}},
                    ],
                    "requestBody": {"content": {"application/json": {"schema": {"type": "object"}}}},
                    "responses": {"200": {"description": "Updated"}},
                    "security": [{"bearerAuth": []}],
                },
                "delete": {
                    "summary": "Delete record",
                    "parameters": [
                        {"name": "model", "in": "path", "required": True, "schema": {"type": "string"}},
                        {"name": "id", "in": "path", "required": True, "schema": {"type": "integer"}},
                    ],
                    "responses": {"204": {"description": "Deleted"}},
                    "security": [{"bearerAuth": []}],
                },
            },
        },
        "components": {
            "securitySchemes": {
                "bearerAuth": {"type": "http", "scheme": "bearer", "bearerFormat": "API Key"},
            },
        },
    }


def rest_openapi(request: Request) -> Response:
    """Serve OpenAPI spec at /api/v1/openapi.json."""
    db = request.headers.get("X-Odoo-Database", "").strip() or os.environ.get("PGDATABASE", "erp")
    try:
        registry = _get_registry(db)
        spec = _build_openapi_spec(registry)
        return _rest_response(spec)
    except Exception as e:
        _logger.exception("OpenAPI error: %s", e)
        return _error_response(str(e), 500)


def rest_docs(request: Request) -> Response:
    """Serve Swagger UI at /api/v1/docs."""
    html = """<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>REST API Docs</title>
<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"/>
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script>
SwaggerUIBundle({
  url: '/api/v1/openapi.json',
  dom_id: '#swagger-ui',
  presets: [SwaggerUIBundle.presets.apis],
});
</script>
</body>
</html>"""
    return Response(html, content_type="text/html; charset=utf-8")
