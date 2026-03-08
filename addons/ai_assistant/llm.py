"""LLM integration - OpenAI function-calling (Phase 88)."""

import json
import os
from typing import Any, Dict, List, Optional

# Tool schema for OpenAI function calling
_TOOL_SCHEMAS = {
    "search_records": {
        "type": "function",
        "function": {
            "name": "search_records",
            "description": "Search records in a model by domain",
            "parameters": {
                "type": "object",
                "properties": {
                    "model": {"type": "string", "description": "Model name (e.g. res.partner, crm.lead)"},
                    "domain": {"type": "array", "description": "Search domain", "items": {}},
                    "limit": {"type": "integer", "description": "Max results", "default": 10},
                },
                "required": ["model"],
            },
        },
    },
    "summarise_recordset": {
        "type": "function",
        "function": {
            "name": "summarise_recordset",
            "description": "Summarise a recordset by model",
            "parameters": {
                "type": "object",
                "properties": {
                    "model": {"type": "string"},
                    "ids": {"type": "array", "items": {"type": "integer"}},
                },
                "required": ["model", "ids"],
            },
        },
    },
    "draft_message": {
        "type": "function",
        "function": {
            "name": "draft_message",
            "description": "Generate draft email/message for a record",
            "parameters": {
                "type": "object",
                "properties": {
                    "model": {"type": "string"},
                    "ids": {"type": "array", "items": {"type": "integer"}},
                },
                "required": ["model", "ids"],
            },
        },
    },
    "create_activity": {
        "type": "function",
        "function": {
            "name": "create_activity",
            "description": "Create an activity/task linked to a lead",
            "parameters": {
                "type": "object",
                "properties": {
                    "lead_id": {"type": "integer"},
                    "name": {"type": "string"},
                    "note": {"type": "string"},
                },
                "required": ["lead_id", "name"],
            },
        },
    },
    "propose_workflow_step": {
        "type": "function",
        "function": {
            "name": "propose_workflow_step",
            "description": "Suggest next stage for a lead",
            "parameters": {
                "type": "object",
                "properties": {
                    "model": {"type": "string", "default": "crm.lead"},
                    "ids": {"type": "array", "items": {"type": "integer"}},
                },
                "required": ["ids"],
            },
        },
    },
}


def _get_api_key(env) -> Optional[str]:
    """Get OpenAI API key from env or ir.config_parameter."""
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    if key:
        return key
    try:
        Param = env["ir.config_parameter"]
        val = Param.get_param("ai.openai_api_key", "")
        return (val or "").strip() or None
    except Exception:
        return None


def _get_tools_for_llm() -> List[Dict]:
    """Build OpenAI tools list from schemas."""
    return list(_TOOL_SCHEMAS.values())


def call_llm(
    env,
    messages: List[Dict[str, str]],
    model: str = "gpt-4o-mini",
    api_key: Optional[str] = None,
) -> str:
    """
    Call OpenAI chat completions with function calling.
    Executes tool_calls, feeds results back, returns final assistant message.
    """
    from ..tools.registry import execute_tool

    key = api_key or _get_api_key(env)
    if not key:
        return "LLM not configured: set OPENAI_API_KEY or ai.openai_api_key in Settings."

    try:
        from openai import OpenAI
    except ImportError:
        return "OpenAI package not installed. Run: pip install openai"

    client = OpenAI(api_key=key)
    tools = _get_tools_for_llm()
    max_iter = 5
    current_messages = list(messages)

    for _ in range(max_iter):
        response = client.chat.completions.create(
            model=model,
            messages=current_messages,
            tools=tools,
        )
        choice = response.choices[0] if response.choices else None
        if not choice:
            return "No response from LLM"
        msg = choice.message
        if not hasattr(msg, "tool_calls") or not msg.tool_calls:
            return (msg.content or "").strip()
        # Build one assistant message with ALL tool_calls, then all tool responses
        tool_calls_list = []
        tool_results = []
        for tc in msg.tool_calls:
            name = tc.function.name if hasattr(tc.function, "name") else getattr(tc, "name", "")
            args_str = tc.function.arguments if hasattr(tc.function, "arguments") else getattr(tc, "arguments", "{}")
            tc_id = getattr(tc, "id", "")
            tool_calls_list.append({"id": tc_id, "type": "function", "function": {"name": name, "arguments": args_str}})
            try:
                kwargs = json.loads(args_str) if args_str else {}
            except json.JSONDecodeError:
                kwargs = {}
            try:
                result = execute_tool(env, name, **kwargs)
                result_str = json.dumps(result) if not isinstance(result, str) else result
            except Exception as e:
                result_str = f"Error: {e}"
            tool_results.append((tc_id, result_str))
        current_messages.append({"role": "assistant", "content": None, "tool_calls": tool_calls_list})
        for tc_id, result_str in tool_results:
            current_messages.append({"role": "tool", "tool_call_id": tc_id, "content": result_str})
    return "Max iterations reached."
