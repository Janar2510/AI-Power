"""AI tool registry - tools execute via ORM under user context."""

import json
import hashlib
from typing import Any, Callable, Dict, List, Optional

# Tool implementations: name -> (handler, description)
# All handlers receive (env, **kwargs) and return result
TOOL_REGISTRY: Dict[str, tuple[Callable, str]] = {}


def _register(name: str, description: str):
    def decorator(fn: Callable):
        TOOL_REGISTRY[name] = (fn, description)
        return fn
    return decorator


@_register("search_records", "Search records in a model by domain")
def search_records(env, model: str, domain: Optional[List] = None, fields: Optional[List[str]] = None, limit: int = 10) -> List[Dict]:
    """Search records - executes as user, respects access rights."""
    domain = domain or []
    try:
        Model = env[model]
    except KeyError:
        return []
    records = Model.search_read(domain, fields or ["name", "id"], limit=limit)
    return records


@_register("summarise_recordset", "Summarise a recordset by model")
def summarise_recordset(env, model: str, ids: List[int], fields: Optional[List[str]] = None) -> str:
    """Summarise records - read and return text summary."""
    try:
        Model = env[model]
    except KeyError:
        return "No records"
    if not ids:
        return "No records"
    fields = fields or ["name", "id"]
    records = Model.read(ids, fields)
    return json.dumps(records, indent=2)


def get_tools() -> List[Dict[str, str]]:
    """Return list of available tools for /ai/tools."""
    return [
        {"name": name, "description": desc}
        for name, (_, desc) in TOOL_REGISTRY.items()
    ]


def execute_tool(env, name: str, **kwargs) -> Any:
    """Execute tool by name under user context."""
    if name not in TOOL_REGISTRY:
        raise ValueError(f"Unknown tool: {name}")
    handler, _ = TOOL_REGISTRY[name]
    return handler(env, **kwargs)


def log_audit(env, prompt_hash: str, tool_calls: str, outcome: str, retrieved_doc_ids: str = "[]") -> None:
    """Log AI invocation to ai.audit.log."""
    try:
        from datetime import datetime, timezone
        AuditLog = env["ai.audit.log"]
        AuditLog.create([{
            "prompt_hash": (prompt_hash or "")[:64],
            "retrieved_doc_ids": retrieved_doc_ids or "[]",
            "tool_calls": tool_calls or "[]",
            "user_id": env.uid,
            "outcome": (outcome or "")[:1000],
            "create_date": datetime.now(timezone.utc).isoformat(),
        }])
    except Exception:
        pass  # Don't fail main flow on audit log error
