"""Sale line MRP cost bridge (phase 302)."""

from core.orm import Model, api, fields


class SaleOrderLine(Model):
    _inherit = "sale.order.line"

    mrp_cost = fields.Computed(
        compute="_compute_mrp_cost",
        string="MRP Cost",
        store=False,
    )
    sale_mrp_margin_component_cost = fields.Computed(
        compute="_compute_sale_mrp_margin_component_cost",
        string="MRP Margin Component Cost",
        store=False,
    )

    @api.depends()
    def _compute_mrp_cost(self):
        return [0.0] * len(self._ids)

    @api.depends()
    def _compute_sale_mrp_margin_component_cost(self):
        return [0.0] * len(self._ids)
