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
    """Create mail.activity linked to crm.lead via activity_schedule. Requires user confirmation."""
    try:
        Lead = env["crm.lead"]
    except KeyError:
        return {"error": "crm.lead model not available"}
    lead = Lead.browse(lead_id)
    rec = lead.activity_schedule(summary=name or "Activity", note=note or "")
    return {"id": rec.id if rec else None, "message": "Activity created"}


@_register("suggest_next_actions", "Suggest next actions for a record (Phase 139)")
def suggest_next_actions(env, model: str, record_id: int) -> List[Dict[str, str]]:
    """Suggest next actions based on record state. User must confirm; no auto-execution."""
    try:
        Model = env[model]
    except KeyError:
        return []
    if model not in ("crm.lead", "project.task"):
        return []
    records = Model.read_ids([record_id], ["name", "stage_id", "expected_revenue", "description", "date_deadline"])
    if not records:
        return []
    r = records[0]
    stage_name = ""
    if r.get("stage_id"):
        try:
            Stage = env["crm.stage"] if model == "crm.lead" else env["project.task.type"]
            stages = Stage.search_read([["id", "=", r["stage_id"]]], ["name"])
            stage_name = stages[0]["name"] if stages else ""
        except KeyError:
            pass
    suggestions = []
    if model == "crm.lead":
        if not stage_name or stage_name in ("New", "Qualified"):
            suggestions.append({"action": "schedule_activity", "label": "Schedule a call", "type": "Call"})
        suggestions.append({"action": "change_stage", "label": "Move to next stage", "type": "workflow"})
        suggestions.append({"action": "draft_message", "label": "Draft email to contact", "type": "Email"})
    elif model == "project.task":
        suggestions.append({"action": "schedule_activity", "label": "Schedule activity", "type": "Meeting"})
        suggestions.append({"action": "change_stage", "label": "Move to next stage", "type": "workflow"})
    return suggestions[:5]


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


@_register("analyze_data", "Analyze data: read_group by measure and groupby, return NL summary (Phase 140)")
def analyze_data(env, model: str, measure: str = "expected_revenue", groupby: Optional[str] = "stage_id", use_llm: bool = True) -> str:
    """Read grouped data and optionally use LLM to generate NL insights."""
    try:
        Model = env[model]
    except KeyError:
        return "Model not found"
    if model not in ("crm.lead", "sale.order"):
        return "analyze_data supports crm.lead and sale.order only"
    measure_field = measure or ("expected_revenue" if model == "crm.lead" else "amount_total")
    groupby_field = groupby or ("stage_id" if model == "crm.lead" else "state")
    try:
        rows = Model.read_group([], [measure_field], [groupby_field], lazy=False)
    except Exception as e:
        return f"Error reading data: {e}"
    if not rows:
        return "No data to analyze"
    summary_lines = []
    total = 0
    for r in rows:
        val = r.get(measure_field, 0) or 0
        total += float(val) if isinstance(val, (int, float)) else 0
        key = r.get(groupby_field)
        label = key if isinstance(key, str) else (r.get(groupby_field + "_display") or str(key))
        summary_lines.append(f"{label}: {val}")
    text_data = "\n".join(summary_lines) + f"\nTotal: {total}"
    if not use_llm:
        return text_data
    try:
        from ..llm import _get_api_key
        from ..controllers.ai_controller import _get_llm_config
        cfg = _get_llm_config(env)
        if (cfg.get("llm_enabled") or "0") != "1":
            return text_data
        key = _get_api_key(env)
        if not key:
            return text_data
        from openai import OpenAI
        client = OpenAI(api_key=key)
        model_name = cfg.get("llm_model", "gpt-4o-mini")
        prompt = f"""Summarize this business data in 2-3 sentences. Highlight key insights or trends.
Data ({model}, {measure_field} by {groupby_field}):
{text_data}

Brief summary:"""
        resp = client.chat.completions.create(model=model_name, messages=[{"role": "user", "content": prompt}])
        content = (resp.choices[0].message.content or "").strip()
        return content or text_data
    except Exception:
        return text_data


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


def _get_embedding(env, text: str) -> Optional[List[float]]:
    """Get embedding vector for text via OpenAI text-embedding-3-small. Returns None on failure."""
    if not text or not str(text).strip():
        return None
    try:
        from ..llm import _get_api_key
        key = _get_api_key(env)
        if not key:
            return None
        from openai import OpenAI
        client = OpenAI(api_key=key)
        resp = client.embeddings.create(
            model="text-embedding-3-small",
            input=text[:8000],
        )
        if resp.data and len(resp.data) > 0:
            return resp.data[0].embedding
    except Exception:
        pass
    return None


def index_record_for_rag(env, model: str, res_id: int) -> None:
    """Index a record for RAG retrieval. Upserts ai.document.chunk. Phase 136: embeds on write."""
    try:
        Chunk = env["ai.document.chunk"]
        M = env[model]
    except KeyError:
        return
    fields_map = {
        "res.partner": ["name", "is_company", "type", "email", "phone", "street", "street2", "city", "zip"],
        "crm.lead": ["name", "description", "expected_revenue"],
        "knowledge.article": ["name", "body_html"],
    }
    fields = fields_map.get(model, ["name"])
    try:
        records = M.read_ids([res_id], fields)
    except Exception:
        return
    if not records:
        return
    r = records[0]
    import re
    parts = []
    for f in fields:
        v = r.get(f, "") or ""
        if isinstance(v, str) and "<" in v and ">" in v:
            v = re.sub(r"<[^>]+>", " ", v)
        parts.append(str(v).strip())
    text = " ".join(p for p in parts if p).strip()
    if not text:
        text = str(res_id)
    embedding = _get_embedding(env, text)
    vals = {"model": model, "res_id": res_id, "text": text}
    if embedding is not None:
        vals["embedding"] = embedding
    existing = Chunk.search_read([("model", "=", model), ("res_id", "=", res_id)], ["id"])
    if existing:
        Chunk.browse(existing[0]["id"]).write(vals)
    else:
        Chunk.create(vals)


@_register("nl_search", "Search records by natural language query; returns domain and results")
def nl_search(env, model: str, query: str, limit: int = 10, use_llm: bool = True) -> Dict[str, Any]:
    """
    Natural language search: convert query to ORM domain and return results.
    When LLM enabled: uses LLM to convert NL to domain.
    Fallback: ilike on name/description.
    """
    domain: List = []
    if use_llm:
        try:
            domain = _nl_to_domain_llm(env, model, query)
        except Exception:
            domain = []
    if not domain:
        domain = _nl_to_domain_fallback(model, query)
    try:
        Model = env[model]
    except KeyError:
        return {"domain": domain, "results": []}
    fields = ["id", "name"]
    if model == "res.partner":
        fields = ["id", "name", "email", "phone", "city"]
    elif model == "crm.lead":
        fields = ["id", "name", "stage_id", "expected_revenue", "description"]
    records = Model.search_read(domain, fields or ["name", "id"], limit=limit)
    return {"domain": domain, "results": records}


def _nl_to_domain_fallback(model: str, query: str) -> List:
    """Fallback: ilike on name and description."""
    if not query or not str(query).strip():
        return []
    q = str(query).strip()
    if model == "res.partner":
        return ["|", ["name", "ilike", q], ["email", "ilike", q]]
    if model == "crm.lead":
        return ["|", ["name", "ilike", q], ["description", "ilike", q]]
    return [["name", "ilike", q]]


def _nl_to_domain_llm(env, model: str, query: str) -> List:
    """Use LLM to convert natural language to ORM domain. Returns [] on failure."""
    try:
        from ..llm import _get_api_key
        from ..controllers.ai_controller import _get_llm_config
        cfg = _get_llm_config(env)
        if (cfg.get("llm_enabled") or "0") != "1":
            return []
        key = _get_api_key(env)
        if not key:
            return []
        from openai import OpenAI
        client = OpenAI(api_key=key)
        model_name = cfg.get("llm_model", "gpt-4o-mini")
        prompt = f"""Convert this search query to an Odoo domain for model {model}.
Query: "{query}"
Return ONLY a JSON array. Examples:
- "contacts named John" -> [["name","ilike","John"]]
- "leads with revenue over 1000" -> [["expected_revenue",">",1000]]
- "partners in Berlin" -> [["city","ilike","Berlin"]]
Return only the JSON array, no other text."""
        resp = client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": prompt}],
        )
        content = (resp.choices[0].message.content or "").strip()
        if not content:
            return []
        parsed = json.loads(content)
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []


@_register("extract_fields", "Extract structured fields from pasted text for a model (AI-assisted data entry)")
def extract_fields(env, model: str, text: str, use_llm: bool = True) -> Dict[str, Any]:
    """
    Extract structured field values from pasted text (e.g. email signature, lead description).
    When LLM enabled: uses OpenAI to extract name, email, phone, etc.
    Fallback: simple regex for email/phone.
    """
    if not text or not str(text).strip():
        return {"fields": {}, "error": None}
    t = str(text).strip()
    if use_llm:
        try:
            result = _extract_fields_llm(env, model, t)
            if result:
                return {"fields": result, "error": None}
        except Exception:
            pass
    return {"fields": _extract_fields_fallback(model, t), "error": None}


def _extract_fields_fallback(model: str, text: str) -> Dict[str, str]:
    """Fallback: regex for email and phone."""
    import re
    result: Dict[str, str] = {}
    email_match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    if email_match:
        result["email"] = email_match.group(0)
    phone_match = re.search(r"[\+]?[(]?[0-9]{2,4}[)]?[-\s\.]?[0-9]{2,4}[-\s\.]?[0-9]{2,6}", text)
    if phone_match:
        result["phone"] = phone_match.group(0).strip()
    return result


def _extract_fields_llm(env, model: str, text: str) -> Optional[Dict[str, Any]]:
    """Use LLM to extract structured fields. Returns None on failure."""
    try:
        from ..llm import _get_api_key
        from ..controllers.ai_controller import _get_llm_config
        cfg = _get_llm_config(env)
        if (cfg.get("llm_enabled") or "0") != "1":
            return None
        key = _get_api_key(env)
        if not key:
            return None
        from openai import OpenAI
        client = OpenAI(api_key=key)
        model_name = cfg.get("llm_model", "gpt-4o-mini")
        if model == "res.partner":
            fields_desc = "name, email, phone, street, city, country, description"
        elif model == "crm.lead":
            fields_desc = "name, email, phone, description, expected_revenue (number)"
        else:
            fields_desc = "name, email, phone, description"
        prompt = f"""Extract structured fields from this text for model {model}.
Supported fields: {fields_desc}
Return ONLY a JSON object with field names as keys and string values (or number for expected_revenue). Omit fields not found.
Text:
{text[:2000]}

Return only the JSON object, no other text."""
        resp = client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": prompt}],
        )
        content = (resp.choices[0].message.content or "").strip()
        if not content:
            return None
        parsed = json.loads(content)
        return parsed if isinstance(parsed, dict) else None
    except Exception:
        return None


def retrieve_chunks(env, query: str, limit: int = 10) -> List[Dict]:
    """Retrieve document chunks. Phase 136: uses cosine similarity when embeddings exist; else text ilike."""
    if not query or not str(query).strip():
        return []
    try:
        Chunk = env["ai.document.chunk"]
    except KeyError:
        return []
    q = str(query).strip()
    embedding = _get_embedding(env, q)
    cr = getattr(env, "cr", None) if env else None
    if embedding is not None and cr is not None:
        try:
            table = getattr(Chunk, "_table", "ai_document_chunk")
            cr.execute(
                f'''SELECT id, model, res_id, text FROM "{table}"
                WHERE embedding IS NOT NULL
                ORDER BY embedding <=> %s
                LIMIT %s''',
                (embedding, limit * 2),
            )
            rows = cr.fetchall()
            chunks = [dict(r) if hasattr(r, "keys") else {"id": r[0], "model": r[1], "res_id": r[2], "text": r[3]} for r in rows]
        except Exception:
            chunks = Chunk.search_read(
                domain=[("text", "ilike", q)],
                fields=["id", "model", "res_id", "text"],
                limit=limit * 2,
            )
    else:
        chunks = Chunk.search_read(
            domain=[("text", "ilike", q)],
            fields=["id", "model", "res_id", "text"],
            limit=limit * 2,
        )
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


@_register("create_record", "Create a record in a model. Phase 214. Requires confirmation for state-changing ops.")
def create_record(env, model: str, vals: Dict[str, Any]) -> Dict[str, Any]:
    """Create a record. Returns {id, error}."""
    try:
        Model = env[model]
    except KeyError:
        return {"id": None, "error": f"Model {model} not found"}
    if not vals or not isinstance(vals, dict):
        return {"id": None, "error": "vals must be a non-empty dict"}
    try:
        rec = Model.create(vals)
        rid = rec.id if hasattr(rec, "id") and rec.id else (rec.ids[0] if rec.ids else None)
        return {"id": rid, "error": None}
    except Exception as e:
        return {"id": None, "error": str(e)}


@_register("update_record", "Update fields on existing records. Phase 214.")
def update_record(env, model: str, ids: List[int], vals: Dict[str, Any]) -> Dict[str, Any]:
    """Update records. Returns {updated: N, error}."""
    try:
        Model = env[model]
    except KeyError:
        return {"updated": 0, "error": f"Model {model} not found"}
    if not ids or not vals or not isinstance(vals, dict):
        return {"updated": 0, "error": "ids and vals required"}
    try:
        Model.browse(ids).write(vals)
        return {"updated": len(ids), "error": None}
    except Exception as e:
        return {"updated": 0, "error": str(e)}


@_register("generate_report", "Trigger report generation and return summary. Phase 214.")
def generate_report(env, report_name: str, ids: Optional[List[int]] = None) -> Dict[str, Any]:
    """Generate report for model/ids. Returns {url, summary, error}."""
    try:
        from core.http.report import _REPORT_REGISTRY, _get_report_from_db
        db = getattr(env.registry, "db_name", None) or ""
        registry = getattr(env, "registry", None)
        reg = _REPORT_REGISTRY.get(report_name)
        if not reg and db and registry:
            reg = _get_report_from_db(report_name, db, registry)
        if not reg:
            return {"url": None, "summary": None, "error": f"Report {report_name} not found"}
        model_name = reg[0]
        ids = ids or []
        if not ids:
            recs = env[model_name].search_read([], ["id", "name"], limit=5)
            ids = [r["id"] for r in recs if r.get("id")]
        url = f"/report/html/{report_name}/{','.join(map(str, ids))}" if ids else None
        summary = f"Report {report_name} for {model_name} ({len(ids)} record(s)). View at {url}" if url else f"Report {report_name} ready."
        return {"url": url, "summary": summary, "error": None}
    except Exception as e:
        return {"url": None, "summary": None, "error": str(e)}


@_register("suggest_products", "Suggest products for user (collaborative filtering). Phase 216.")
def suggest_products(env, limit: int = 5, user_id: Optional[int] = None) -> List[Dict]:
    """Suggest products based on purchase history. Returns [{id, name, list_price}]."""
    try:
        Product = env["product.product"]
    except KeyError:
        return []
    try:
        Line = env.get("sale.order.line")
        if Line:
            lines = Line.search_read([], ["product_id"], limit=100)
            bought = [l.get("product_id") for l in lines if l.get("product_id")]
            if bought:
                from collections import Counter
                top = [pid for pid, _ in Counter(bought).most_common(limit)]
                recs = Product.search_read([("id", "in", top)], ["id", "name", "list_price"], limit=limit)
                return [{"id": r["id"], "name": r.get("name", ""), "list_price": r.get("list_price", 0)} for r in recs]
    except Exception:
        pass
    recs = Product.search_read([], ["id", "name", "list_price"], limit=limit)
    return [{"id": r["id"], "name": r.get("name", ""), "list_price": r.get("list_price", 0)} for r in recs]


@_register("schedule_action", "Create ir.cron entry for deferred execution. Phase 214.")
def schedule_action(env, name: str, model: str, method: str, interval_minutes: int = 60) -> Dict[str, Any]:
    """Create ir.cron record. Returns {id, error}."""
    try:
        Cron = env["ir.cron"]
    except KeyError:
        return {"id": None, "error": "ir.cron model not available"}
    if not name or not model or not method:
        return {"id": None, "error": "name, model, method required"}
    try:
        from datetime import datetime, timedelta, timezone
        next_run = (datetime.now(timezone.utc) + timedelta(minutes=interval_minutes)).isoformat()
        rec = Cron.create({
            "name": name[:64],
            "model": model,
            "method": method,
            "interval_minutes": interval_minutes,
            "next_run": next_run,
            "active": True,
        })
        rid = rec.id if hasattr(rec, "id") and rec.id else (rec.ids[0] if rec.ids else None)
        return {"id": rid, "error": None}
    except Exception as e:
        return {"id": None, "error": str(e)}


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
