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


@_register("draft_message", "Generate draft email/message for a record")
def draft_message(env, model: str, ids: List[int], fields: Optional[List[str]] = None) -> str:
    """Generate a draft message body from record data."""
    try:
        M = env[model]
    except KeyError:
        return "Unknown model"
    if not ids:
        return "No record specified"
    fields = fields or ["name", "email", "phone", "street", "city", "country", "description"]
    records = M.read_ids(ids, fields)
    if not records:
        return "Record not found"
    r = records[0]
    lines = [f"Dear {r.get('name', 'Customer')},"]
    if r.get("email"):
        lines.append(f"\nEmail: {r['email']}")
    if r.get("phone"):
        lines.append(f"Phone: {r['phone']}")
    if r.get("street") or r.get("city"):
        addr = ", ".join(filter(None, [r.get("street"), r.get("city"), r.get("country")]))
        lines.append(f"\nAddress: {addr}")
    if r.get("description"):
        lines.append(f"\nRegarding: {r['description'][:200]}...")
    lines.append("\n\nBest regards,")
    return "\n".join(lines)


@_register("create_activity", "Create an activity/task linked to a lead")
def create_activity(env, lead_id: int, name: str, note: Optional[str] = None) -> dict:
    """Create crm.activity linked to crm.lead. Requires user confirmation for state-changing actions."""
    try:
        Activity = env["crm.activity"]
    except KeyError:
        return {"error": "crm.activity model not available"}
    vals = {"name": name or "Activity", "lead_id": lead_id}
    if note:
        vals["note"] = note
    rec = Activity.create(vals)
    return {"id": rec._ids[0] if rec and rec._ids else None, "message": "Activity created"}


@_register("propose_workflow_step", "Suggest next stage for a lead")
def propose_workflow_step(env, model: str, ids: List[int]) -> str:
    """Suggest next workflow stage for crm.lead. Read-only."""
    if model != "crm.lead":
        return f"propose_workflow_step only supports crm.lead, got {model}"
    try:
        Lead = env["crm.lead"]
        Stage = env["crm.stage"]
    except KeyError:
        return "crm.lead or crm.stage not available"
    if not ids:
        return "No lead specified"
    records = Lead.read_ids(ids, ["name", "stage_id"])
    if not records:
        return "Lead not found"
    stages = Stage.search_read([], ["id", "name", "sequence", "is_won", "fold"])
    stage_by_id = {s["id"]: s for s in stages}
    stage_order = sorted([s for s in stages if not s.get("is_won") and not s.get("fold")], key=lambda x: x.get("sequence", 0))
    suggestions = []
    for r in records:
        sid = r.get("stage_id")
        stage_name = stage_by_id.get(sid, {}).get("name", "?") if sid else "New"
        idx = next((i for i, s in enumerate(stage_order) if s["id"] == sid), -1)
        if idx >= 0 and idx + 1 < len(stage_order):
            next_name = stage_order[idx + 1].get("name", "?")
            suggestions.append(f"{r.get('name', 'Lead')} (current: {stage_name}) → suggest: {next_name}")
        else:
            suggestions.append(f"{r.get('name', 'Lead')} (current: {stage_name}) → already closed")
    return "\n".join(suggestions)


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
    records = Model.read_ids(ids, fields)
    return json.dumps(records, indent=2)


def index_record_for_rag(env, model: str, res_id: int) -> None:
    """Index a record for RAG retrieval. Upserts ai.document.chunk."""
    try:
        Chunk = env["ai.document.chunk"]
        M = env[model]
    except KeyError:
        return
    fields_map = {
        "res.partner": ["name", "is_company", "type", "email", "phone", "street", "street2", "city", "zip"],
        "crm.lead": ["name", "description", "expected_revenue"],
    }
    fields = fields_map.get(model, ["name"])
    try:
        records = M.read_ids([res_id], fields)
    except Exception:
        return
    if not records:
        return
    r = records[0]
    parts = [str(r.get(f, "") or "") for f in fields]
    text = " ".join(p for p in parts if p).strip()
    if not text:
        text = str(res_id)
    existing = Chunk.search_read([("model", "=", model), ("res_id", "=", res_id)], ["id"])
    vals = {"model": model, "res_id": res_id, "text": text}
    if existing:
        Chunk.browse(existing[0]["id"]).write(vals)
    else:
        Chunk.create(vals)


def retrieve_chunks(env, query: str, limit: int = 10) -> List[Dict]:
    """Retrieve document chunks by text search. Applies record rules: only returns chunks for records user can read."""
    if not query or not str(query).strip():
        return []
    try:
        Chunk = env["ai.document.chunk"]
    except KeyError:
        return []
    chunks = Chunk.search_read(
        domain=[("text", "ilike", str(query).strip())],
        fields=["id", "model", "res_id", "text"],
        limit=limit * 2,
    )  # fetch extra to allow for filtering
    result = []
    for c in chunks:
        model_name = c.get("model")
        res_id = c.get("res_id")
        if not model_name or res_id is None:
            continue
        try:
            Model = env[model_name]
            recs = Model.read_ids([res_id], ["id"])
            if recs:
                result.append({"id": c.get("id"), "model": model_name, "res_id": res_id, "text": (c.get("text") or "")[:500]})
        except (KeyError, Exception):
            pass
        if len(result) >= limit:
            break
    return result


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
        AuditLog.create({
            "prompt_hash": (prompt_hash or "")[:64],
            "retrieved_doc_ids": retrieved_doc_ids or "[]",
            "tool_calls": tool_calls or "[]",
            "user_id": env.uid,
            "outcome": (outcome or "")[:1000],
            "create_date": datetime.now(timezone.utc).isoformat(),
        })
    except Exception:
        pass  # Don't fail main flow on audit log error
