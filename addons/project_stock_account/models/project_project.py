"""Project analytic helper for stock + valuation count (plan field)."""

from core.orm import Model, api, fields


class ProjectProject(Model):
    _inherit = "project.project"

    stock_valuation_count = fields.Computed(
        compute="_compute_stock_valuation_count",
        store=False,
        string="Stock Valuation Count",
    )

    @api.depends()
    def _compute_stock_valuation_count(self):
        return [0] * len(self._ids)

    def _get_analytic_distribution(self):
        aa = self.read(["analytic_account_id"])
        aid = aa[0].get("analytic_account_id") if aa else None
        if isinstance(aid, (list, tuple)) and aid:
            aid = aid[0]
        if aid:
            return {"account_id": aid}
        return {}
