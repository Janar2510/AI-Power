"""Sale order ↔ project stock valuation (plan field)."""

from core.orm import Model, api, fields


class SaleOrder(Model):
    _inherit = "sale.order"

    project_stock_valuation_count = fields.Computed(
        compute="_compute_project_stock_valuation_count",
        store=False,
        string="Project Stock Valuation Count",
    )

    @api.depends()
    def _compute_project_stock_valuation_count(self):
        return [0] * len(self._ids)
