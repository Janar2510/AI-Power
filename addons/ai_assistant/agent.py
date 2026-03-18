"""Phase 214: AI autonomous agent - ReAct loop for multi-step task execution."""

import json
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional

from addons.ai_assistant.tools.registry import execute_tool, get_tools
from addons.ai_assistant.llm import _get_api_key


def _get_tool_schemas_for_agent() -> List[Dict]:
    """Build OpenAI tools list for agent (includes create_record, update_record, etc.)."""
    try:
        from addons.ai_assistant.llm import _TOOL_SCHEMAS
        schemas = dict(_TOOL_SCHEMAS)
    except Exception:
        schemas = {}
    # Add Phase 214 tools
    schemas["search_records"] = schemas.get("search_records", {
        "type": "function",
        "function": {
            "name": "search_records",
            "description": "Search records in a model by domain",
            "parameters": {
                "type": "object",
                "properties": {
                    "model": {"type": "string"},
                    "domain": {"type": "array"},
                    "limit": {"type": "integer", "default": 10},
                },
                "required": ["model"],
            },
        },
    })
    schemas["create_record"] = {
        "type": "function",
        "function": {
            "name": "create_record",
            "description": "Create a record in a model",
            "parameters": {
                "type": "object",
                "properties": {
                    "model": {"type": "string"},
                    "vals": {"type": "object"},
                },
                "required": ["model", "vals"],
            },
        },
    }
    schemas["update_record"] = {
        "type": "function",
        "function": {
            "name": "update_record",
            "description": "Update fields on existing records",
            "parameters": {
                "type": "object",
                "properties": {
                    "model": {"type": "string"},
                    "ids": {"type": "array", "items": {"type": "integer"}},
                    "vals": {"type": "object"},
                },
                "required": ["model", "ids", "vals"],
            },
        },
    }
    schemas["generate_report"] = {
        "type": "function",
        "function": {
            "name": "generate_report",
            "description": "Trigger report generation and return summary",
            "parameters": {
                "type": "object",
                "properties": {
                    "report_name": {"type": "string"},
                    "ids": {"type": "array", "items": {"type": "integer"}},
                },
                "required": ["report_name"],
            },
        },
    }
    schemas["schedule_action"] = {
        "type": "function",
        "function": {
            "name": "schedule_action",
            "description": "Create ir.cron entry for deferred execution",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "model": {"type": "string"},
                    "method": {"type": "string"},
                    "interval_minutes": {"type": "integer", "default": 60},
                },
                "required": ["name", "model", "method"],
            },
        },
    }
    return list(schemas.values())


def run_agent(
    env,
    goal: str,
    max_iter: int = 10,
    timeout_seconds: Optional[int] = None,
    task_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Run ReAct-style agent loop: plan -> execute tool -> observe -> decide next step.
    Creates or updates ai.agent.task. Returns {task_id, status, result, steps}.
    """
    now = datetime.now(timezone.utc).isoformat()
    Task = env.get("ai.agent.task")
    if not Task:
        return {"task_id": None, "status": "failed", "result": "ai.agent.task model not available", "steps": []}

    if task_id:
        task_rec = Task.browse(task_id)
        if not task_rec.ids or task_rec.ids[0] != task_id:
            return {"task_id": task_id, "status": "failed", "result": "Task not found", "steps": []}
        steps_data = task_rec.read_ids([task_id], ["steps", "status"])[0] if task_rec.ids else {}
        steps = json.loads(steps_data.get("steps") or "[]") if isinstance(steps_data.get("steps"), str) else (steps_data.get("steps") or [])
        if steps_data.get("status") != "running":
            return {"task_id": task_id, "status": steps_data.get("status", "unknown"), "result": None, "steps": steps}
    else:
        task_rec = Task.create({
            "user_id": env.uid,
            "goal": goal[:2000],
            "steps": "[]",
            "status": "running",
            "result": None,
            "create_date": now,
            "write_date": now,
        })
        task_id = task_rec.id if hasattr(task_rec, "id") and task_rec.id else (task_rec.ids[0] if task_rec.ids else None)
        steps = []

    key = _get_api_key(env)
    if not key:
        Task.browse(task_id).write({"status": "failed", "result": "LLM not configured", "write_date": now})
        return {"task_id": task_id, "status": "failed", "result": "LLM not configured", "steps": steps}

    try:
        from openai import OpenAI
    except ImportError:
        Task.browse(task_id).write({"status": "failed", "result": "OpenAI package not installed", "write_date": now})
        return {"task_id": task_id, "status": "failed", "result": "OpenAI package not installed", "steps": steps}

    from addons.ai_assistant.controllers.ai_controller import _get_llm_config
    cfg = _get_llm_config(env)
    model_name = cfg.get("llm_model", "gpt-4o-mini")
    client = OpenAI(api_key=key)
    tools = _get_tool_schemas_for_agent()
    messages = [
        {"role": "system", "content": f"You are an autonomous AI agent for an ERP. Goal: {goal[:500]}. Use tools to accomplish the goal. After each tool result, decide: continue with another tool, or respond with final summary."},
        {"role": "user", "content": f"Accomplish this goal: {goal}"},
    ]

    for i in range(max_iter):
        response = client.chat.completions.create(model=model_name, messages=messages, tools=tools)
        choice = response.choices[0] if response.choices else None
        if not choice:
            break
        msg = choice.message
        if not hasattr(msg, "tool_calls") or not msg.tool_calls:
            result = (msg.content or "").strip()
            Task.browse(task_id).write({
                "status": "done",
                "result": result[:5000],
                "steps": json.dumps(steps),
                "write_date": datetime.now(timezone.utc).isoformat(),
            })
            return {"task_id": task_id, "status": "done", "result": result, "steps": steps}

        for tc in msg.tool_calls:
            name = tc.function.name if hasattr(tc.function, "name") else getattr(tc, "name", "")
            args_str = tc.function.arguments if hasattr(tc.function, "arguments") else getattr(tc, "arguments", "{}")
            try:
                kwargs = json.loads(args_str) if args_str else {}
            except json.JSONDecodeError:
                kwargs = {}
            try:
                result = execute_tool(env, name, **kwargs)
                result_str = json.dumps(result) if not isinstance(result, str) else result
            except Exception as e:
                result_str = f"Error: {e}"
            steps.append({"tool": name, "kwargs": kwargs, "result": (result_str or "")[:1000]})
            messages.append({"role": "assistant", "content": None, "tool_calls": [{"id": getattr(tc, "id", ""), "type": "function", "function": {"name": name, "arguments": args_str}}]})
            messages.append({"role": "tool", "tool_call_id": getattr(tc, "id", ""), "content": result_str})

        Task.browse(task_id).write({
            "steps": json.dumps(steps),
            "write_date": datetime.now(timezone.utc).isoformat(),
        })

    Task.browse(task_id).write({
        "status": "failed",
        "result": "Max iterations reached",
        "steps": json.dumps(steps),
        "write_date": datetime.now(timezone.utc).isoformat(),
    })
    return {"task_id": task_id, "status": "failed", "result": "Max iterations reached", "steps": steps}
