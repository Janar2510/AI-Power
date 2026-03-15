"""Purchase order line (Phase 117)."""

from core.orm import Model, fields


class PurchaseOrderLine(Model):
    _name = "purchase.order.line"
    _description = "Purchase Order Line"

    order_id = fields.Many2one("purchase.order", string="Order", required=True, ondelete="cascade")
    product_id = fields.Many2one("product.product", string="Product")
    name = fields.Char(string="Description")
    product_qty = fields.Float(string="Quantity", default=1.0)
    price_unit = fields.Float(string="Unit Price", default=0.0)
