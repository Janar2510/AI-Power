"""ir.dashboard.widget - Dashboard KPI widgets (Phase 93)."""

import json
from typing import Any, Dict, List, Type, TypeVar

from core.orm import Model, fields

T = TypeVar("T", bound="Model")


class IrDashboardWidget(Model):
    _name = "ir.dashboard.widget"
    _description = "Dashboard Widget"

    name = fields.Char(required=True, string="Name")
    model = fields.Char(required=True, string="Model")
    domain = fields.Text(string="Domain")
    measure_field = fields.Char(string="Measure Field")
    aggregate = fields.Selection(
        selection=[
            ("count", "Count"),
            ("sum", "Sum"),
            ("avg", "Average"),
        ],
        default="count",
        string="Aggregate",
    )
    widget_type = fields.Selection(
        selection=[
            ("number", "Number"),
            ("chart", "Chart"),
            ("list", "List"),
        ],
        default="number",
        string="Type",
    )
    sequence = fields.Integer(default=10, string="Sequence")
    user_id = fields.Many2one("res.users", string="User")

    def get_data(self) -> List[Dict[str, Any]]:
        """Execute widget config per id; return [{id, name, value, trend}]. Instance method for env/cursor (Phase 105)."""
        env = getattr(self, "env", None)
        if not env:
            return []
        recs_data = self.read(["id", "name", "model", "domain", "measure_field", "aggregate"])
        result = []
        for r in recs_data:
            model_name = r.get("model")
            if not model_name:
                result.append({"id": r["id"], "name": r.get("name"), "value": 0, "trend": None})
                continue
            ModelCls = env.get(model_name)
            if not ModelCls:
                result.append({"id": r["id"], "name": r.get("name"), "value": 0, "trend": None})
                continue
            domain = []
            try:
                domain_str = (r.get("domain") or "[]").strip()
                if domain_str:
                    uid = getattr(env, "uid", 1)
                    domain = eval(domain_str, {"uid": uid, "__builtins__": {}}, {"uid": uid})
                    domain = list(domain) if isinstance(domain, (list, tuple)) else []
            except Exception:
                pass
            agg = r.get("aggregate") or "count"
            measure = r.get("measure_field")
            try:
                if agg == "count":
                    value = ModelCls.search_count(domain, env=env)
                elif agg in ("sum", "avg") and measure:
                    rows = ModelCls.read_group(domain, [measure], [], lazy=False, env=env)
                    value = rows[0].get(measure, 0) if rows else 0
                    if agg == "avg" and rows and rows[0].get("__count"):
                        cnt = rows[0]["__count"]
                        value = value / cnt if cnt else 0
                else:
                    value = ModelCls.search_count(domain, env=env)
            except Exception:
                value = 0  # Phase 106: degrade gracefully when model/table missing
            result.append({
                "id": r["id"],
                "name": r.get("name"),
                "value": value,
                "trend": None,
                "domain": domain,
            })
        return result
