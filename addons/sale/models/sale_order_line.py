"""Sale order line (Phase 112)."""

from core.orm import Model, api, fields


class SaleOrderLine(Model):
    _name = "sale.order.line"
    _description = "Sales Order Line"

    order_id = fields.Many2one("sale.order", string="Order", required=True, ondelete="cascade")
    product_id = fields.Many2one("product.product", string="Product")
    name = fields.Char(string="Description")
    product_uom_qty = fields.Float(string="Quantity", default=1.0)
    price_unit = fields.Float(string="Unit Price", default=0.0)
    price_subtotal = fields.Computed(compute="_compute_price_subtotal", string="Subtotal")

    @api.depends("product_uom_qty", "price_unit")
    def _compute_price_subtotal(self):
        if not self:
            return []
        rows = self.read(["product_uom_qty", "price_unit"])
        return [r.get("product_uom_qty", 0) * r.get("price_unit", 0) for r in rows]
