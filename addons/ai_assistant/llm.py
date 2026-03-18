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
    "suggest_next_actions": {
        "type": "function",
        "function": {
            "name": "suggest_next_actions",
            "description": "Suggest next actions for a record (schedule activity, change stage, draft email)",
            "parameters": {
                "type": "object",
                "properties": {
                    "model": {"type": "string"},
                    "record_id": {"type": "integer"},
                },
                "required": ["model", "record_id"],
            },
        },
    },
    # Phase 218: unified tool schemas for chat (all registry tools)
    "analyze_data": {
        "type": "function",
        "function": {
            "name": "analyze_data",
            "description": "Analyze data: read_group by measure and groupby, return NL summary",
            "parameters": {
                "type": "object",
                "properties": {
                    "model": {"type": "string", "description": "Model name (crm.lead, sale.order)"},
                    "measure": {"type": "string", "description": "Measure field", "default": "expected_revenue"},
                    "groupby": {"type": "string", "description": "Group-by field", "default": "stage_id"},
                    "use_llm": {"type": "boolean", "description": "Use LLM for NL summary", "default": True},
                },
                "required": ["model"],
            },
        },
    },
    "analyze_kpi": {
        "type": "function",
        "function": {
            "name": "analyze_kpi",
            "description": "Analyze KPI: read_group by measure, groupby, period. Returns data, summary, anomalies.",
            "parameters": {
                "type": "object",
                "properties": {
                    "model": {"type": "string", "description": "Model (crm.lead, sale.order, account.move, stock.move)"},
                    "measure": {"type": "string", "default": "expected_revenue"},
                    "groupby": {"type": "string", "default": "stage_id"},
                    "period": {"type": "string", "description": "Time period for time-series"},
                },
                "required": ["model"],
            },
        },
    },
    "forecast_metric": {
        "type": "function",
        "function": {
            "name": "forecast_metric",
            "description": "Forecast metric using exponential smoothing on recent records",
            "parameters": {
                "type": "object",
                "properties": {
                    "model": {"type": "string", "description": "Model (sale.order, crm.lead, account.move)"},
                    "measure": {"type": "string", "default": "amount_total"},
                    "periods_ahead": {"type": "integer", "description": "Periods to forecast", "default": 4},
                },
                "required": ["model"],
            },
        },
    },
    "nl_search": {
        "type": "function",
        "function": {
            "name": "nl_search",
            "description": "Search records by natural language query; returns domain and results",
            "parameters": {
                "type": "object",
                "properties": {
                    "model": {"type": "string"},
                    "query": {"type": "string", "description": "Natural language search query"},
                    "limit": {"type": "integer", "default": 10},
                    "use_llm": {"type": "boolean", "default": True},
                },
                "required": ["model", "query"],
            },
        },
    },
    "extract_fields": {
        "type": "function",
        "function": {
            "name": "extract_fields",
            "description": "Extract structured fields from pasted text for a model (AI-assisted data entry)",
            "parameters": {
                "type": "object",
                "properties": {
                    "model": {"type": "string", "description": "Model (res.partner, crm.lead)"},
                    "text": {"type": "string", "description": "Pasted text to extract from"},
                    "use_llm": {"type": "boolean", "default": True},
                },
                "required": ["model", "text"],
            },
        },
    },
    "create_record": {
        "type": "function",
        "function": {
            "name": "create_record",
            "description": "Create a record in a model. Requires confirmation for state-changing ops.",
            "parameters": {
                "type": "object",
                "properties": {
                    "model": {"type": "string"},
                    "vals": {"type": "object", "description": "Field values dict"},
                },
                "required": ["model", "vals"],
            },
        },
    },
    "update_record": {
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
    },
    "generate_report": {
        "type": "function",
        "function": {
            "name": "generate_report",
            "description": "Trigger report generation and return summary/URL",
            "parameters": {
                "type": "object",
                "properties": {
                    "report_name": {"type": "string"},
                    "ids": {"type": "array", "items": {"type": "integer"}},
                },
                "required": ["report_name"],
            },
        },
    },
    "suggest_products": {
        "type": "function",
        "function": {
            "name": "suggest_products",
            "description": "Suggest products for user based on purchase history (collaborative filtering)",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {"type": "integer", "default": 5},
                    "user_id": {"type": "integer", "description": "Optional user ID"},
                },
            },
        },
    },
    "schedule_action": {
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
    },
    "score_lead": {
        "type": "function",
        "function": {
            "name": "score_lead",
            "description": "Score a lead 0-100 based on revenue, type, stage. Writes ai_score, ai_score_label.",
            "parameters": {
                "type": "object",
                "properties": {
                    "lead_id": {"type": "integer"},
                },
                "required": ["lead_id"],
            },
        },
    },
    "assign_lead": {
        "type": "function",
        "function": {
            "name": "assign_lead",
            "description": "Assign lead to salesperson with lowest open lead count",
            "parameters": {
                "type": "object",
                "properties": {
                    "lead_id": {"type": "integer"},
                    "user_ids": {"type": "array", "items": {"type": "integer"}, "description": "Optional list of user IDs to choose from"},
                },
                "required": ["lead_id"],
            },
        },
    },
    "process_document": {
        "type": "function",
        "function": {
            "name": "process_document",
            "description": "Extract vendor bill data from image/PDF using LLM vision. Optionally create draft vendor bill.",
            "parameters": {
                "type": "object",
                "properties": {
                    "attachment_id": {"type": "integer"},
                    "create_bill": {"type": "boolean", "default": False},
                },
                "required": ["attachment_id"],
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
) -> tuple:
    """
    Call OpenAI chat completions with function calling (Phase 137: ReAct tool chaining).
    Executes tool_calls, feeds results back, loops up to max_iter.
    Returns (result_str, tool_chain) where tool_chain is list of {tool, kwargs, result} for audit.
    """
    from ..tools.registry import execute_tool

    key = api_key or _get_api_key(env)
    if not key:
        return ("LLM not configured: set OPENAI_API_KEY or ai.openai_api_key in Settings.", [])

    try:
        from openai import OpenAI
    except ImportError:
        return ("OpenAI package not installed. Run: pip install openai", [])

    client = OpenAI(api_key=key)
    tools = _get_tools_for_llm()
    max_iter = 5
    current_messages = list(messages)
    tool_chain: List[Dict[str, Any]] = []

    for _ in range(max_iter):
        response = client.chat.completions.create(
            model=model,
            messages=current_messages,
            tools=tools,
        )
        choice = response.choices[0] if response.choices else None
        if not choice:
            return ("No response from LLM", tool_chain)
        msg = choice.message
        if not hasattr(msg, "tool_calls") or not msg.tool_calls:
            return ((msg.content or "").strip(), tool_chain)
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
            tool_chain.append({"tool": name, "kwargs": kwargs, "result": (result_str or "")[:500]})
            tool_results.append((tc_id, result_str))
        current_messages.append({"role": "assistant", "content": None, "tool_calls": tool_calls_list})
        for tc_id, result_str in tool_results:
            current_messages.append({"role": "tool", "tool_call_id": tc_id, "content": result_str})
    return ("Max iterations reached.", tool_chain)
