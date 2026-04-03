"""AI controller - /ai/chat (jsonrpc), /ai/tools (http), /ai/config (http).

All routes require an active session (auth="user").  Rate limiting on /ai/chat
is enforced in-process via a sliding window counter keyed on session UID.
"""

import json
import hashlib
import time
from collections import defaultdict
from datetime import datetime, timezone

from core.http.controller import route
from core.http.auth import get_session_uid, get_session_db, _get_registry
from core.http.request import Request
from core.sql_db import get_cursor
from core.orm import Environment
from werkzeug.wrappers import Response

from ..tools.registry import get_tools, execute_tool, log_audit, retrieve_chunks, nl_search, extract_fields
from ..llm import call_llm
from ..agent import run_agent

import logging
_logger = logging.getLogger(__name__)

# ── Rate limiting ─────────────────────────────────────────────────────────────
_RATE_LIMIT_MAX = 30       # requests per window
_RATE_LIMIT_WINDOW = 60    # seconds
_rate_counters: dict = defaultdict(list)  # uid -> [timestamp, ...]


def _check_rate_limit(uid: int) -> bool:
    """Return True if the request is within the allowed rate, False if over limit."""
    now = time.monotonic()
    bucket = _rate_counters[uid]
    # Remove entries outside the window
    _rate_counters[uid] = [t for t in bucket if now - t < _RATE_LIMIT_WINDOW]
    if len(_rate_counters[uid]) >= _RATE_LIMIT_MAX:
        return False
    _rate_counters[uid].append(now)
    return True


def _get_llm_config(env) -> dict:
    """Return LLM config from ir.config_parameter."""
    try:
        Param = env["ir.config_parameter"]
        llm_enabled = (Param.get_param("ai.llm_enabled", "0") or "0").strip()
        llm_model = (Param.get_param("ai.llm_model", "gpt-4o-mini") or "gpt-4o-mini").strip()
        return {"llm_enabled": llm_enabled, "llm_model": llm_model}
    except Exception:
        return {"llm_enabled": "0", "llm_model": "gpt-4o-mini"}


@route("/ai/config", auth="user", methods=["GET"])
def ai_config(request: Request) -> Response:
    """Return AI config (llm_enabled, llm_model). Auth required."""
    uid = get_session_uid(request)
    db = get_session_db(request)
    if uid is None:
        return Response(json.dumps({"error": "unauthorized"}), status=401, content_type="application/json")
    registry = _get_registry(db)
    with get_cursor(db) as cr:
        env = Environment(registry, cr=cr, uid=uid)
        registry.set_env(env)
        cfg = _get_llm_config(env)
    return Response(json.dumps(cfg), content_type="application/json")


@route("/ai/tools", auth="user", methods=["GET"])
def ai_tools(request: Request) -> Response:
    """List available AI tools. Requires auth."""
    uid = get_session_uid(request)
    if uid is None:
        return Response(json.dumps({"error": "unauthorized"}), status=401, content_type="application/json")
    tools = get_tools()
    return Response(json.dumps(tools), content_type="application/json")


@route("/ai/retrieve", auth="user", methods=["GET"])
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


@route("/ai/nl_search", auth="user", methods=["POST"])
def ai_nl_search(request: Request) -> Response:
    """Natural language search: convert query to domain and return results. Auth required."""
    uid = get_session_uid(request)
    db = get_session_db(request)
    if uid is None:
        return Response(json.dumps({"error": "unauthorized"}), status=401, content_type="application/json")
    try:
        data = request.get_json() or {}
        model = (data.get("model") or "").strip()
        query = (data.get("query") or "").strip()
        limit = min(int(data.get("limit", 80)), 200)
        if not model:
            return Response(
                json.dumps({"error": "model required"}),
                status=400,
                content_type="application/json",
            )
        registry = _get_registry(db)
        with get_cursor(db) as cr:
            env = Environment(registry, cr=cr, uid=uid)
            registry.set_env(env)
            result = nl_search(env, model=model, query=query, limit=limit)
        return Response(json.dumps(result), content_type="application/json")
    except Exception as e:
        return Response(
            json.dumps({"error": str(e)}),
            status=500,
            content_type="application/json",
        )


@route("/ai/extract_fields", auth="user", methods=["POST"])
def ai_extract_fields(request: Request) -> Response:
    """Extract structured fields from pasted text for a model. Auth required."""
    uid = get_session_uid(request)
    db = get_session_db(request)
    if uid is None:
        return Response(json.dumps({"error": "unauthorized"}), status=401, content_type="application/json")
    try:
        data = request.get_json() or {}
        model = (data.get("model") or "").strip()
        text = (data.get("text") or "").strip()
        if not model:
            return Response(
                json.dumps({"error": "model required"}),
                status=400,
                content_type="application/json",
            )
        registry = _get_registry(db)
        with get_cursor(db) as cr:
            env = Environment(registry, cr=cr, uid=uid)
            registry.set_env(env)
            result = extract_fields(env, model=model, text=text)
        return Response(json.dumps(result), content_type="application/json")
    except Exception as e:
        return Response(
            json.dumps({"error": str(e)}),
            status=500,
            content_type="application/json",
        )


@route("/ai/process-document", auth="user", methods=["POST"])
def ai_process_document(request: Request) -> Response:
    """Extract vendor bill data from attachment using LLM vision. Phase 222."""
    uid = get_session_uid(request)
    db = get_session_db(request)
    if uid is None:
        return Response(json.dumps({"error": "unauthorized"}), status=401, content_type="application/json")
    try:
        data = request.get_json() or {}
        attachment_id = data.get("attachment_id")
        if attachment_id is None:
            return Response(
                json.dumps({"error": "attachment_id required"}),
                status=400,
                content_type="application/json",
            )
        create_bill = bool(data.get("create_bill", False))
        registry = _get_registry(db)
        with get_cursor(db) as cr:
            env = Environment(registry, cr=cr, uid=uid)
            registry.set_env(env)
            result = execute_tool(env, "process_document", attachment_id=int(attachment_id), create_bill=create_bill)
        return Response(json.dumps(result), content_type="application/json")
    except Exception as e:
        return Response(
            json.dumps({"data": None, "move_id": None, "error": str(e)}),
            status=500,
            content_type="application/json",
        )


@route("/ai/chat/stream", auth="user", methods=["GET", "POST"])
def ai_chat_stream(request: Request) -> Response:
    """Phase C3: streaming hook — not enabled; returns 501 until SSE/WebSocket product scope."""
    return Response(
        json.dumps({"error": "streaming_not_enabled", "hint": "Use POST /ai/chat"}),
        status=501,
        content_type="application/json",
    )


@route("/ai/chat", auth="user", methods=["POST"])
def ai_chat(request: Request) -> Response:
    """Handle AI chat - tool calls or LLM execute as requesting user."""
    uid = get_session_uid(request)
    db = get_session_db(request)
    if uid is None:
        return Response(json.dumps({"error": "unauthorized"}), status=401, content_type="application/json")

    # Rate limit: 30 requests per minute per session user
    if not _check_rate_limit(uid):
        _logger.warning("AI chat rate limit exceeded for uid=%s", uid)
        return Response(
            json.dumps({"error": "rate_limit_exceeded", "retry_after": _RATE_LIMIT_WINDOW}),
            status=429,
            content_type="application/json",
        )

    try:
        data = request.get_json() or {}
        prompt = data.get("prompt", "").strip()
        tool_name = data.get("tool", "").strip()
        tool_kwargs = data.get("kwargs", {})
        do_retrieve = data.get("retrieve", True)
        conversation_id = data.get("conversation_id")
        model_context = (data.get("model_context") or "").strip()
        active_id = data.get("active_id")

        prompt_hash = hashlib.sha256(prompt.encode()).hexdigest() if prompt else ""

        registry = _get_registry(db)
        with get_cursor(db) as cr:
            env = Environment(registry, cr=cr, uid=uid)
            registry.set_env(env)
            cfg = _get_llm_config(env)
            llm_enabled = cfg.get("llm_enabled", "0") == "1"

            if tool_name:
                # Tool mode: execute specific tool
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
                return Response(json.dumps({"result": result}), content_type="application/json")

            if llm_enabled and prompt:
                # LLM mode: use OpenAI with RAG context and optional conversation history
                chunks = retrieve_chunks(env, prompt, limit=5) if do_retrieve else []
                context_parts = [c.get("text", "") for c in chunks if c.get("text")]
                system_content = "You are an AI assistant for an ERP system. Use the available tools to search, summarise, draft messages, create activities, and propose workflow steps."
                if model_context and active_id is not None:
                    system_content += f"\n\nUser is currently viewing {model_context} record id={active_id}. You may reference this context."
                if context_parts:
                    context_text = "\n".join(p[:500] for p in context_parts)[:2000]
                    system_content += "\n\nRelevant context from the database:\n" + context_text
                prior_messages = []
                conv = None
                out_conv_id = None
                if conversation_id:
                    try:
                        Conv = env.get("ai.conversation")
                        if Conv:
                            conv = Conv.browse(int(conversation_id))
                            rows = conv.read_ids([conv.id], ["user_id", "messages"]) if conv.ids else []
                            if rows and rows[0].get("user_id") == uid:
                                raw = rows[0].get("messages") or "[]"
                                prior_messages = json.loads(raw) if isinstance(raw, str) else (raw or [])
                            else:
                                conv = None
                    except (ValueError, KeyError, TypeError):
                        conv = None
                messages = [{"role": "system", "content": system_content}]
                messages.extend(prior_messages[-20:])
                messages.append({"role": "user", "content": prompt})
                result, tool_chain = call_llm(env, messages, model=cfg.get("llm_model", "gpt-4o-mini"))
                new_messages = prior_messages + [{"role": "user", "content": prompt}, {"role": "assistant", "content": result or ""}]
                now = datetime.now(timezone.utc).isoformat()
                try:
                    Conv = env.get("ai.conversation")
                    if Conv:
                        payload = {
                            "user_id": uid,
                            "messages": json.dumps(new_messages[-50:]),
                            "model_context": model_context or "",
                            "active_id": int(active_id) if active_id is not None else None,
                            "write_date": now,
                        }
                        if conv and conv.ids:
                            conv.write(payload)
                            out_conv_id = conv.id
                        else:
                            payload["create_date"] = now
                            rec = Conv.create(payload)
                            out_conv_id = rec.id if hasattr(rec, "id") else (rec.get("id") if isinstance(rec, dict) else None)
                except Exception:
                    out_conv_id = conversation_id if conversation_id else None
                retrieved_doc_ids = json.dumps([{"model": c.get("model"), "res_id": c.get("res_id")} for c in chunks])
                log_audit(
                    env,
                    prompt_hash=prompt_hash,
                    tool_calls=json.dumps(tool_chain) if tool_chain else json.dumps([{"tool": "llm", "kwargs": {}}]),
                    outcome=(result or "")[:1000],
                    retrieved_doc_ids=retrieved_doc_ids,
                )
                return Response(json.dumps({"result": result, "conversation_id": out_conv_id}), content_type="application/json")

            return Response(
                json.dumps({"error": "tool required", "hint": "Select a tool or enable LLM in Settings > AI Configuration"}),
                status=400,
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


@route("/ai/agent/run", auth="user", methods=["POST"])
def ai_agent_run(request: Request) -> Response:
    """Run autonomous agent. Phase 214. Creates ai.agent.task, runs ReAct loop."""
    uid = get_session_uid(request)
    db = get_session_db(request)
    if uid is None:
        return Response(json.dumps({"error": "unauthorized"}), status=401, content_type="application/json")
    try:
        data = request.get_json() or {}
        goal = (data.get("goal") or "").strip()
        task_id = data.get("task_id")
        max_iter = min(int(data.get("max_iter", 10)), 20)
        if not goal and not task_id:
            return Response(
                json.dumps({"error": "goal or task_id required"}),
                status=400,
                content_type="application/json",
            )
        registry = _get_registry(db)
        with get_cursor(db) as cr:
            env = Environment(registry, cr=cr, uid=uid)
            registry.set_env(env)
            result = run_agent(env, goal=goal or "Continue", max_iter=max_iter, task_id=task_id)
        return Response(json.dumps(result), content_type="application/json")
    except Exception as e:
        return Response(
            json.dumps({"error": str(e)}),
            status=500,
            content_type="application/json",
        )


@route("/ai/agent/status", auth="user", methods=["GET"])
def ai_agent_status(request: Request) -> Response:
    """Get agent task status. Phase 214."""
    uid = get_session_uid(request)
    db = get_session_db(request)
    if uid is None:
        return Response(json.dumps({"error": "unauthorized"}), status=401, content_type="application/json")
    task_id = request.args.get("task_id")
    if not task_id:
        return Response(
            json.dumps({"error": "task_id required"}),
            status=400,
            content_type="application/json",
        )
    try:
        tid = int(task_id)
        registry = _get_registry(db)
        with get_cursor(db) as cr:
            env = Environment(registry, cr=cr, uid=uid)
            registry.set_env(env)
            Task = env.get("ai.agent.task")
            if not Task:
                return Response(json.dumps({"error": "ai.agent.task not available"}), status=500, content_type="application/json")
            recs = Task.search_read([("id", "=", tid), ("user_id", "=", uid)], ["id", "goal", "steps", "status", "result", "create_date"])
        if not recs:
            return Response(json.dumps({"error": "Task not found"}), status=404, content_type="application/json")
        r = recs[0]
        steps = json.loads(r.get("steps") or "[]") if isinstance(r.get("steps"), str) else (r.get("steps") or [])
        return Response(json.dumps({
            "task_id": r.get("id"),
            "goal": r.get("goal"),
            "status": r.get("status"),
            "result": r.get("result"),
            "steps": steps,
            "create_date": r.get("create_date"),
        }), content_type="application/json")
    except (ValueError, Exception) as e:
        return Response(
            json.dumps({"error": str(e)}),
            status=500,
            content_type="application/json",
        )
