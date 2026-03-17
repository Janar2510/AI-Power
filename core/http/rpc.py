"""Session-aware RPC dispatcher - call_kw / execute_kw for ORM."""

import inspect
import json
import logging
from typing import Any, Dict, List, Optional

from werkzeug.wrappers import Response

from core.sql_db import get_cursor
from core.orm import Environment
from core.orm.models import ModelBase
from core.orm.security import build_access_map, check_access, get_user_groups
from core.tools import config

from .request import Request
from .auth import get_session_uid, get_session_db, _get_registry

_logger = logging.getLogger("erp.rpc")

_ACCESS_MAP: Optional[dict] = None


def _get_access_map() -> dict:
    """Lazy-load access map from module security CSVs."""
    global _ACCESS_MAP
    if _ACCESS_MAP is None:
        try:
            _ACCESS_MAP = build_access_map(config.get_addons_paths())
        except Exception as e:
            _logger.warning("Failed to load access map: %s", e)
            _ACCESS_MAP = {}
    return _ACCESS_MAP


def _op_for_method(method: str) -> str:
    """Map ORM method to access operation."""
    if method in ("search", "search_read", "search_count", "read", "read_group", "get_param", "onchange", "fields_get", "default_get", "name_get", "name_search"):
        return "read"
    if method in ("create", "import_data"):
        return "create"
    if method in ("write", "set_param", "action_confirm", "copy", "action_mark_won", "activity_schedule", "message_post"):
        return "write"
    if method == "unlink":
        return "unlink"
    return "read"  # default


def _rpc_unauthorized(req_id: Any) -> Response:
    """Return JSON-RPC error for missing/invalid session."""
    return Response(
        json.dumps({
            "jsonrpc": "2.0",
            "error": {"code": 401, "message": "Session expired or invalid. Please log in again."},
            "id": req_id,
        }),
        status=401,
        mimetype="application/json",
    )


class UserError(Exception):
    """User-facing error (validation, constraint violation)."""
    pass


_CLASS_METHODS = frozenset({
    "create", "import_data", "search", "search_read", "search_count", "read", "read_group", "read_ids", "write_ids",
    "fields_get", "default_get", "onchange", "name_get", "name_search", "write", "copy",
    "process_email_queue",  # Phase 166: mail.mail class method
})


def _merge_args_kwargs(fn: Any, args: List, kwargs: Dict) -> tuple:
    """Remove from kwargs any params already provided positionally to avoid 'multiple values' errors."""
    try:
        sig = inspect.signature(fn)
        params = [p for p in sig.parameters if p not in ("self", "cls")]
        # Skip *args, **kwargs, etc.
        positional_names = []
        for p in params:
            par = sig.parameters.get(p)
            if par is None:
                break
            if par.kind in (inspect.Parameter.VAR_POSITIONAL, inspect.Parameter.VAR_KEYWORD):
                break
            positional_names.append(p)
        # Remove from kwargs any key that is filled by args
        filtered = dict(kwargs)
        for i, name in enumerate(positional_names):
            if i < len(args) and name in filtered:
                del filtered[name]
        return args, filtered
    except (ValueError, TypeError):
        return args, kwargs


def _call_kw(uid: int, db: str, model: str, method: str, args: List, kwargs: Dict) -> Any:
    """Execute model method with user context."""
    if model is None or not str(model).strip():
        raise ValueError("Model name is required")
    registry = _get_registry(db)
    try:
        with get_cursor(db) as cr:
            env = Environment(registry, cr=cr, uid=uid)
            registry.set_env(env)
            Model = env.get(model)
            if Model is None:
                raise ValueError(f"Model {model!r} not found. Available: {list(registry.keys())}")
            fn = getattr(Model, method, None)
            if method == "read" and hasattr(Model, "read_ids"):
                fn = getattr(Model, "read_ids")
            elif method == "write" and hasattr(Model, "write_ids"):
                fn = getattr(Model, "write_ids")
            elif method == "search_count" and fn is None:
                # Fallback for models that may not have search_count (e.g. before Phase 56)
                search_fn = getattr(Model, "search", None)
                if search_fn:
                    domain = args[0] if args else []
                    return len(search_fn(domain))
            if fn is None:
                raise ValueError(f"Model {model} has no method {method}")
            try:
                if method not in _CLASS_METHODS:
                    # Recordset method: first arg is ids; carry env to avoid closed cursor (Phase 105)
                    ids = args[0] if args else []
                    from core.orm.models import Recordset
                    recs = Recordset(Model, ids, _env=env)
                    recs_method = getattr(recs, method)
                    rargs, rkwargs = _merge_args_kwargs(recs_method, args[1:], kwargs)
                    return recs_method(*rargs, **rkwargs)
                rargs, rkwargs = _merge_args_kwargs(fn, args, kwargs)
                return fn(*rargs, **rkwargs)
            except Exception as e:
                from core.orm.api import ValidationError
                if isinstance(e, ValidationError):
                    raise UserError(str(e)) from e
                raise
    finally:
        # Clear stale env so no code reuses a closed cursor (Phase 105)
        registry.set_env(None)


def dispatch_jsonrpc(request: Request) -> Response:
    """Handle JSON-RPC request. Session required for object service."""
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            return Response(
                json.dumps({
                    "jsonrpc": "2.0",
                    "error": {"code": -32700, "message": "Parse error"},
                    "id": None,
                }),
                status=400,
                mimetype="application/json",
            )
        method = data.get("method", "")
        params = data.get("params", {})
        req_id = data.get("id")
        path = getattr(request, "path", "") or ""
        is_call_kw_path = path == "/web/dataset/call_kw" or path.startswith("/web/dataset/call_kw/")

        # Odoo 19.0 /web/dataset/call_kw format: params = { model, method, args, kwargs }
        if method == "call" and is_call_kw_path and isinstance(params, dict):
            model_name = params.get("model")
            method_name = params.get("method")
            method_args = params.get("args", [])
            method_kwargs = params.get("kwargs", {})
            if not isinstance(method_args, list):
                method_args = [method_args] if method_args else []
            if not isinstance(method_kwargs, dict):
                method_kwargs = {}

            uid = get_session_uid(request)
            db = get_session_db(request)
            if uid is None:
                _logger.warning("RPC 401: no session (cookie missing or invalid)")
                return _rpc_unauthorized(req_id)

            if model_name is None or not str(model_name).strip():
                return Response(
                    json.dumps({
                        "jsonrpc": "2.0",
                        "error": {"code": -32602, "message": "Invalid params: model name required"},
                        "id": req_id,
                    }),
                    status=400,
                    mimetype="application/json",
                )

            op = _op_for_method(str(method_name or "read"))
            registry = _get_registry(db)
            user_groups = get_user_groups(registry, db, uid) if uid else set()
            if not check_access(_get_access_map(), str(model_name or ""), op, user_groups=user_groups):
                return Response(
                    json.dumps({
                        "jsonrpc": "2.0",
                        "error": {"code": 403, "message": f"Access denied: {op} on {model_name}"},
                        "id": req_id,
                    }),
                    status=403,
                    mimetype="application/json",
                )

            # Odoo copy: args may be [id] or [[id]]; we expect single id
            if method_name == "copy" and method_args:
                first = method_args[0]
                if isinstance(first, list):
                    method_args = [first[0] if first else 0] + list(method_args[1:])

            # Odoo create: args = [records] where records is list of dicts; our create expects single dict
            if method_name == "create" and method_args and isinstance(method_args[0], list):
                records = method_args[0]
                if records and isinstance(records[0], dict):
                    method_args = [records[0]]  # single record: pass dict to our create

            try:
                result = _call_kw(uid, db, model_name, method_name, method_args, method_kwargs)
                from core.orm.models import Recordset
                if isinstance(result, Recordset):
                    result = result.ids
                elif isinstance(result, ModelBase):
                    result = result.id if result.id is not None else result.ids
                if model_name in ("res.partner", "crm.lead", "knowledge.article") and method_name in ("create", "write", "copy"):
                    try:
                        from addons.ai_assistant.tools.registry import index_record_for_rag
                        registry = _get_registry(db)
                        with get_cursor(db) as cr:
                            env = Environment(registry, cr=cr, uid=uid)
                            registry.set_env(env)
                            ids_to_index = []
                            if method_name == "create" or method_name == "copy":
                                ids_to_index = [result] if isinstance(result, int) else (result or [])
                            elif method_name == "write" and method_args and len(method_args) >= 1:
                                ids_to_index = method_args[0] if isinstance(method_args[0], list) else [method_args[0]]
                            for rid in ids_to_index:
                                index_record_for_rag(env, model_name, int(rid))
                    except Exception:
                        pass
                return Response(
                    json.dumps({"jsonrpc": "2.0", "result": result, "id": req_id}),
                    mimetype="application/json",
                )
            except Exception as e:
                _logger.exception("call_kw error: %s", e)
                return Response(
                    json.dumps({
                        "jsonrpc": "2.0",
                        "error": {"code": -32603, "message": str(e)},
                        "id": req_id,
                    }),
                    status=500,
                    mimetype="application/json",
                )

        # Legacy /jsonrpc: method "call" with params { service, method, args }
        if method == "call":
            if isinstance(params, list) and len(params) >= 2:
                params = params[1] if isinstance(params[1], dict) else {}
            service = params.get("service", "") if isinstance(params, dict) else ""
            inner_method = params.get("method", "") if isinstance(params, dict) else ""
            args = params.get("args", []) if isinstance(params, dict) else []
            if not isinstance(args, list):
                args = []

            if service == "object" and inner_method in ("execute_kw", "call_kw", "call"):
                # Object service requires session
                uid = get_session_uid(request)
                db = get_session_db(request)
                if uid is None:
                    _logger.warning("RPC 401: no session (cookie missing or invalid)")
                    return _rpc_unauthorized(req_id)

                # args: [model, method_name, args, kwargs] or [model, method_name, [domain], {}]
                if len(args) < 2:
                    return Response(
                        json.dumps({
                            "jsonrpc": "2.0",
                            "error": {"code": -32602, "message": "Invalid params: need model and method"},
                            "id": req_id,
                        }),
                        status=400,
                        mimetype="application/json",
                    )
                model_name = args[0]
                method_name = args[1]
                method_args = args[2] if len(args) > 2 else []
                method_kwargs = args[3] if len(args) > 3 else {}

                if model_name is None or not str(model_name).strip():
                    return Response(
                        json.dumps({
                            "jsonrpc": "2.0",
                            "error": {"code": -32602, "message": "Invalid params: model name required"},
                            "id": req_id,
                        }),
                        status=400,
                        mimetype="application/json",
                    )

                op = _op_for_method(str(method_name or "read"))
                registry = _get_registry(db)
                user_groups = get_user_groups(registry, db, uid) if uid else set()
                if not check_access(_get_access_map(), str(model_name or ""), op, user_groups=user_groups):
                    return Response(
                        json.dumps({
                            "jsonrpc": "2.0",
                            "error": {"code": 403, "message": f"Access denied: {op} on {model_name}"},
                            "id": req_id,
                        }),
                        status=403,
                        mimetype="application/json",
                    )

                if not isinstance(method_args, list):
                    method_args = [method_args] if method_args else []
                if not isinstance(method_kwargs, dict):
                    method_kwargs = {}

                try:
                    result = _call_kw(uid, db, model_name, method_name, method_args, method_kwargs)
                    # Serialize for JSON: Recordset/Model -> ids, keep list/dict/bool as-is
                    from core.orm.models import Recordset
                    if isinstance(result, Recordset):
                        result = result.ids
                    elif isinstance(result, ModelBase):
                        result = result.id if result.id is not None else result.ids
                    return Response(
                        json.dumps({"jsonrpc": "2.0", "result": result, "id": req_id}),
                        mimetype="application/json",
                    )
                except Exception as e:
                    _logger.exception("call_kw error: %s", e)
                    return Response(
                        json.dumps({
                            "jsonrpc": "2.0",
                            "error": {"code": -32603, "message": str(e)},
                            "id": req_id,
                        }),
                        status=500,
                        mimetype="application/json",
                    )

        # Fallback: echo for unknown methods (backward compat, no session required)
        result = {"method": method, "params": params}
        return Response(
            json.dumps({"jsonrpc": "2.0", "result": result, "id": req_id}),
            mimetype="application/json",
        )
    except Exception as e:
        _logger.exception("jsonrpc error: %s", e)
        return Response(
            json.dumps({
                "jsonrpc": "2.0",
                "error": {"code": -32603, "message": str(e)},
                "id": None,
            }),
            status=500,
            mimetype="application/json",
        )
