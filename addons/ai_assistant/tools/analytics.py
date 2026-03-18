"""Phase 215: AI analytics and predictive forecasting tools."""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from .registry import _register


@_register("analyze_kpi", "Analyze KPI: read_group by measure, groupby, period. Phase 215.")
def analyze_kpi(
    env,
    model: str,
    measure: str = "expected_revenue",
    groupby: Optional[str] = "stage_id",
    period: Optional[str] = None,
) -> Dict[str, Any]:
    """Read grouped KPI data. period: day/week/month for time-series. Returns {data, summary, anomalies}."""
    try:
        Model = env[model]
    except KeyError:
        return {"data": [], "summary": "", "anomalies": [], "error": "Model not found"}
    if model not in ("crm.lead", "sale.order", "account.move", "stock.move"):
        return {"data": [], "summary": "", "anomalies": [], "error": f"analyze_kpi supports crm.lead, sale.order, account.move, stock.move; got {model}"}
    measure_field = measure or ("expected_revenue" if model == "crm.lead" else "amount_total")
    groupby_field = groupby or ("stage_id" if model == "crm.lead" else "state")
    try:
        rows = Model.read_group([], [measure_field], [groupby_field], lazy=False)
    except Exception as e:
        return {"data": [], "summary": "", "anomalies": [], "error": str(e)}
    if not rows:
        return {"data": [], "summary": "No data to analyze.", "anomalies": [], "error": None}
    total = sum((r.get(measure_field) or 0) for r in rows)
    data = [{"group": r.get(groupby_field), "value": r.get(measure_field) or 0} for r in rows]
    mean_val = total / len(rows) if rows else 0
    anomalies = []
    for r in data:
        v = r.get("value") or 0
        if mean_val and abs(v - mean_val) > 1.5 * mean_val:
            anomalies.append({"group": r.get("group"), "value": v, "deviation": "high" if v > mean_val else "low"})
    summary = f"Total {measure_field}: {total:.1f} across {len(rows)} groups. Mean: {mean_val:.1f}."
    if anomalies:
        summary += f" {len(anomalies)} anomaly(ies) detected."
    return {"data": data, "summary": summary, "anomalies": anomalies, "error": None}


@_register("forecast_metric", "Forecast metric using exponential smoothing. Phase 215.")
def forecast_metric(
    env,
    model: str,
    measure: str = "amount_total",
    periods_ahead: int = 4,
) -> Dict[str, Any]:
    """Forecast time-series metric. Uses simple exponential smoothing on recent records. Returns {forecast, values, stored_id}."""
    try:
        Model = env[model]
    except KeyError:
        return {"forecast": [], "values": [], "stored_id": None, "error": "Model not found"}
    if model not in ("sale.order", "crm.lead", "account.move"):
        return {"forecast": [], "values": [], "stored_id": None, "error": f"forecast_metric supports sale.order, crm.lead, account.move; got {model}"}
    measure_field = measure or ("expected_revenue" if model == "crm.lead" else "amount_total")
    try:
        rows = Model.search_read([], [measure_field], limit=50)
    except Exception as e:
        return {"forecast": [], "values": [], "stored_id": None, "error": str(e)}
    if not rows:
        return {"forecast": [], "values": [], "stored_id": None, "error": None}
    values = [float(r.get(measure_field) or 0) for r in rows]

    def _smooth(vals: List[float], alpha: float = 0.3) -> List[float]:
        if not vals:
            return []
        out = [vals[0]]
        for v in vals[1:]:
            out.append(alpha * v + (1 - alpha) * out[-1])
        return out

    smoothed = _smooth(values)
    last = smoothed[-1] if smoothed else 0
    forecast = [last] * periods_ahead

    stored_id = None
    if forecast and (last or True):
        try:
            Forecast = env.get("ai.forecast")
            if Forecast:
                import json
                rec = Forecast.create({
                    "model": model,
                    "measure": measure_field,
                    "periods_ahead": periods_ahead,
                    "forecast_values": json.dumps(forecast),
                    "last_value": last,
                    "create_date": datetime.now(timezone.utc).isoformat(),
                })
                stored_id = rec.id if hasattr(rec, "id") and rec.id else (rec.ids[0] if rec.ids else None)
        except Exception:
            pass

    return {"forecast": forecast, "values": values[-10:], "stored_id": stored_id, "error": None}
