"""Phase 220: AI lead scoring and smart assignment tools."""

from typing import Any, Dict, List, Optional

from .registry import _register


def _score_label(score: float) -> str:
    """Map 0-100 score to hot/warm/cold."""
    if score >= 75:
        return "hot"
    if score >= 50:
        return "warm"
    return "cold"


@_register("score_lead", "Score a lead 0-100 based on historical conversion, revenue, stage. Phase 220.")
def score_lead(
    env,
    lead_id: int,
) -> Dict[str, Any]:
    """
    Compute AI score for a lead from historical data. Writes ai_score and ai_score_label.
    Uses: expected_revenue bracket, type (opportunity vs lead), stage position.
    """
    try:
        Lead = env["crm.lead"]
        Stage = env["crm.stage"]
    except KeyError:
        return {"score": 0, "label": "cold", "error": "crm.lead not available"}
    recs = Lead.search_read([("id", "=", lead_id)], ["expected_revenue", "type", "stage_id"])
    if not recs:
        return {"score": 0, "label": "cold", "error": "Lead not found"}
    r = recs[0]
    revenue = float(r.get("expected_revenue") or 0)
    lead_type = r.get("type") or "lead"
    stage_id = r.get("stage_id")

    stages = Stage.search_read([], ["id", "sequence", "is_won", "fold"], order="sequence")
    stage_order = {s["id"]: (i, s) for i, s in enumerate(stages)}
    max_seq = len(stages) - 1 if stages else 0

    score = 50.0
    if revenue > 0:
        if revenue >= 10000:
            score += 20
        elif revenue >= 1000:
            score += 10
    if lead_type == "opportunity":
        score += 15
    if stage_id and stage_order:
        idx, s = stage_order.get(stage_id, (0, {}))
        if s.get("is_won"):
            score = 100.0
        elif s.get("fold"):
            score = 0.0
        elif max_seq > 0:
            score += 10 * (idx / max_seq)

    score = max(0, min(100, score))
    label = _score_label(score)
    try:
        Lead.browse([lead_id]).write({"ai_score": score, "ai_score_label": label})
    except Exception as e:
        return {"score": score, "label": label, "error": str(e)}
    return {"score": score, "label": label, "error": None}


@_register("assign_lead", "Assign lead to salesperson with lowest open lead count. Phase 220.")
def assign_lead(
    env,
    lead_id: int,
    user_ids: Optional[List[int]] = None,
) -> Dict[str, Any]:
    """
    Assign lead to user with fewest open leads. If user_ids not provided, uses res.users (active).
    """
    try:
        Lead = env["crm.lead"]
        User = env["res.users"]
    except KeyError:
        return {"assigned_to": None, "error": "crm.lead or res.users not available"}
    recs = Lead.search_read([("id", "=", lead_id)], ["id"])
    if not recs:
        return {"assigned_to": None, "error": "Lead not found"}
    if user_ids is None:
        users = User.search_read([("active", "=", True)], ["id"], limit=20)
        user_ids = [u["id"] for u in users if u.get("id")]
    if not user_ids:
        return {"assigned_to": None, "error": "No users to assign to"}
    counts = []
    for uid in user_ids:
        n = Lead.search_count([("user_id", "=", uid)])
        counts.append((uid, n))
    best_uid = min(counts, key=lambda x: x[1])[0]
    try:
        Lead.browse([lead_id]).write({"user_id": best_uid})
    except Exception as e:
        return {"assigned_to": best_uid, "error": str(e)}
    return {"assigned_to": best_uid, "error": None}
