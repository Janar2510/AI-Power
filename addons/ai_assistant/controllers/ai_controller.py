"""AI controller - /ai/chat (jsonrpc) and /ai/tools (http)."""

import json
import hashlib

from core.http.controller import route
from core.http.auth import get_session_uid, get_session_db, _get_registry
from core.http.request import Request
from core.sql_db import get_cursor
from core.orm import Environment
from werkzeug.wrappers import Response

from ..tools.registry import get_tools, execute_tool, log_audit, retrieve_chunks


@route("/ai/tools", auth="public", methods=["GET"])
def ai_tools(request: Request) -> Response:
    """List available AI tools. Requires auth."""
    uid = get_session_uid(request)
    if uid is None:
        return Response(json.dumps({"error": "unauthorized"}), status=401, content_type="application/json")
    tools = get_tools()
    return Response(json.dumps(tools), content_type="application/json")


@route("/ai/retrieve", auth="public", methods=["GET"])
def ai_retrieve(request: Request) -> Response:
    """Retrieve document chunks by query. Auth required. Record rules applied before retrieval."""
    uid = get_session_uid(request)
    db = get_session_db(request)
    if uid is None:
        return Response(json.dumps({"error": "unauthorized"}), status=401, content_type="application/json")
    q = request.args.get("q", "").strip()
    limit = min(int(request.args.get("limit", 10)), 50)
    if not q:
        return Response(json.dumps([]), content_type="application/json")
    registry = _get_registry(db)
    with get_cursor(db) as cr:
        env = Environment(registry, cr=cr, uid=uid)
        registry.set_env(env)
        chunks = retrieve_chunks(env, q, limit=limit)
    return Response(json.dumps(chunks), content_type="application/json")


@route("/ai/chat", auth="public", methods=["POST"])
def ai_chat(request: Request) -> Response:
    """Handle AI chat - tool calls execute as requesting user."""
    uid = get_session_uid(request)
    db = get_session_db(request)
    if uid is None:
        return Response(json.dumps({"error": "unauthorized"}), status=401, content_type="application/json")

    try:
        data = request.get_json() or {}
        prompt = data.get("prompt", "")
        tool_name = data.get("tool", "").strip()
        tool_kwargs = data.get("kwargs", {})
        do_retrieve = data.get("retrieve", False)

        prompt_hash = hashlib.sha256(prompt.encode()).hexdigest() if prompt else ""

        if not tool_name:
            return Response(
                json.dumps({"error": "tool required", "tool": tool_name}),
                status=400,
                content_type="application/json",
            )

        registry = _get_registry(db)
        with get_cursor(db) as cr:
            env = Environment(registry, cr=cr, uid=uid)
            registry.set_env(env)
            retrieved_doc_ids = "[]"
            if do_retrieve and prompt:
                chunks = retrieve_chunks(env, prompt, limit=5)
                retrieved_doc_ids = json.dumps([{"model": c.get("model"), "res_id": c.get("res_id")} for c in chunks])
            result = execute_tool(env, tool_name, **tool_kwargs)
            outcome = json.dumps(result) if not isinstance(result, str) else result
            log_audit(
                env,
                prompt_hash=prompt_hash,
                tool_calls=json.dumps([{"tool": tool_name, "kwargs": tool_kwargs}]),
                outcome=outcome[:1000],
                retrieved_doc_ids=retrieved_doc_ids,
            )

        return Response(
            json.dumps({"result": result}),
            content_type="application/json",
        )
    except ValueError as e:
        return Response(
            json.dumps({"error": str(e)}),
            status=400,
            content_type="application/json",
        )
    except Exception as e:
        return Response(
            json.dumps({"error": str(e)}),
            status=500,
            content_type="application/json",
        )
