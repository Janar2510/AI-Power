"""Bridge stock/purchase counters on sale lines."""

from core.orm import Model, api, fields


class SaleOrderLinePurchaseStock(Model):
    _inherit = "sale.order.line"

    purchase_stock_move_count = fields.Integer(
        string="Purchase/Stock Moves",
        compute="_compute_purchase_stock_move_count",
    )

    @api.depends("purchase_line_ids")
    def _compute_purchase_stock_move_count(self):
        for line in self:
            line.purchase_stock_move_count = len(line.purchase_line_ids) if line.purchase_line_ids else 0
