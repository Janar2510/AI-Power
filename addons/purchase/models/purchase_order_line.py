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

    @classmethod
    def _onchange_product_id(cls, vals):
        """Fill price_unit from product list_price, name from product name (Phase 165)."""
        pid = vals.get("product_id")
        if not pid:
            return {}
        if isinstance(pid, (list, tuple)) and pid:
            pid = pid[0]
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            return {}
        Product = env.get("product.product")
        if not Product:
            return {}
        try:
            rows = Product.browse([pid]).read(["list_price", "name"])
            if not rows:
                return {}
            r = rows[0]
            return {"price_unit": r.get("list_price", 0.0), "name": r.get("name", "")}
        except Exception:
            return {}
