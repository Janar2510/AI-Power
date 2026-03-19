"""Stock move originating from a PO line."""

from core.orm import Model, fields


class StockMove(Model):
    _inherit = "stock.move"

    purchase_line_id = fields.Many2one("purchase.order.line", string="PO Line", ondelete="set null")
