"""Purchase order line (Phase 117, 154)."""

from core.orm import Model, api, fields


class PurchaseOrderLine(Model):
    _name = "purchase.order.line"
    _description = "Purchase Order Line"

    order_id = fields.Many2one("purchase.order", string="Order", required=True, ondelete="cascade")
    product_id = fields.Many2one("product.product", string="Product")
    name = fields.Char(string="Description")
    product_qty = fields.Float(string="Quantity", default=1.0)
    price_unit = fields.Float(string="Unit Price", default=0.0)
    price_subtotal = fields.Computed(compute="_compute_price_subtotal", string="Subtotal")

    @api.depends("product_qty", "price_unit")
    def _compute_price_subtotal(self):
        if not self:
            return []
        rows = self.read(["product_qty", "price_unit"])
        return [r.get("product_qty", 0) * r.get("price_unit", 0) for r in rows]
