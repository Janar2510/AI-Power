"""Sale order stock with project context (Phase 302)."""

from core.orm import Model, api, fields


class SaleOrder(Model):
    _inherit = "sale.order"

    project_picking_count = fields.Computed(
        compute="_compute_project_picking_count",
        store=False,
        string="Project Picking Count",
    )
    sale_project_stock_move_count = fields.Computed(
        compute="_compute_sale_project_stock_move_count",
        store=False,
        string="Sale Project Stock Move Count",
    )

    @api.depends()
    def _compute_project_picking_count(self):
        return [0] * len(self._ids)

    @api.depends()
    def _compute_sale_project_stock_move_count(self):
        return [0] * len(self._ids)
