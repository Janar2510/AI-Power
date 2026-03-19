"""PO lines linked to stock moves for subcontracting flows."""

from core.orm import Model, fields


class PurchaseOrderLine(Model):
    _inherit = "purchase.order.line"

    move_ids = fields.One2many("stock.move", "purchase_line_id", string="Stock Moves")
    is_subcontract_line = fields.Boolean(string="Is Subcontract Line", default=False)
