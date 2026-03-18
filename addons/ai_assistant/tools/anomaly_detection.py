"""Phase 231: AI anomaly detection and smart alerts."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from .registry import _register


def _get_llm_explain(env, prompt: str) -> Optional[str]:
    """Get LLM explanation when enabled."""
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
        resp = client.chat.completions.create(model=model_name, messages=[{"role": "user", "content": prompt}])
        return (resp.choices[0].message.content or "").strip()
    except Exception:
        return None


@_register("detect_anomalies", "Detect statistical anomalies in transactions, inventory, expenses. Phase 231.")
def detect_anomalies(
    env,
    model: str = "account.move",
    lookback_days: int = 30,
) -> Dict[str, Any]:
    """Scan recent data for outliers (Z-score > 3). Returns {anomalies, count}."""
    Move = env.get("account.move")
    if not Move:
        return {"anomalies": [], "count": 0, "error": "account.move not found"}
    rows = Move.search_read([("state", "=", "posted")], ["id", "name", "amount_total", "move_type"], limit=200)
    if not rows:
        return {"anomalies": [], "count": 0, "error": None}
    amounts = [float(r.get("amount_total") or 0) for r in rows]
    n = len(amounts)
    if n < 3:
        return {"anomalies": [], "count": 0, "error": None}
    mean = sum(amounts) / n
    var = sum((x - mean) ** 2 for x in amounts) / n
    std = (var ** 0.5) if var > 0 else 0
    anomalies = []
    for i, r in enumerate(rows):
        val = float(r.get("amount_total") or 0)
        if std and abs(val - mean) > 3 * std:
            anomalies.append({
                "model": model,
                "res_id": r.get("id"),
                "name": r.get("name"),
                "amount": val,
                "z_score": (val - mean) / std if std else 0,
            })
            try:
                Anomaly = env.get("ai.anomaly")
                if Anomaly:
                    Anomaly.create({
                        "anomaly_type": "amount_outlier",
                        "severity": "high" if abs(val - mean) > 4 * std else "medium",
                        "model_name": model,
                        "res_id": r.get("id"),
                        "explanation": f"Amount {val:.0f} deviates from mean {mean:.0f}",
                        "create_date": datetime.now(timezone.utc).isoformat(),
                    })
            except Exception:
                pass
    return {"anomalies": anomalies[:10], "count": len(anomalies), "error": None}


@_register("explain_anomaly", "Generate human-readable explanation for an anomaly. Phase 231.")
def explain_anomaly(
    env,
    anomaly_id: int,
    use_llm: bool = True,
) -> Dict[str, Any]:
    """Given anomaly record, get LLM explanation and suggested action."""
    Anomaly = env.get("ai.anomaly")
    if not Anomaly:
        return {"explanation": "", "suggested_action": "", "error": "ai.anomaly not found"}
    rec = Anomaly.browse(anomaly_id)
    rows = rec.read(["anomaly_type", "severity", "model_name", "res_id", "explanation"]) if rec.ids else []
    if not rows:
        return {"explanation": "", "suggested_action": "", "error": "Anomaly not found"}
    r = rows[0]
    base = r.get("explanation") or ""
    suggested = ""
    if use_llm and base:
        prompt = f"Anomaly: {r.get('anomaly_type')}, severity {r.get('severity')}. Model {r.get('model_name')} id {r.get('res_id')}. {base}. Suggest one action in 1 sentence."
        suggested = _get_llm_explain(env, prompt) or ""
    return {"explanation": base, "suggested_action": suggested, "error": None}
