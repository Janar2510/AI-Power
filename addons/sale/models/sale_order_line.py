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
    tax_id = fields.Many2many("account.tax", string="Taxes", help="Phase 181")
    price_subtotal = fields.Computed(compute="_compute_price_subtotal", string="Subtotal")

    @api.depends("product_uom_qty", "price_unit", "tax_id")
    def _compute_price_subtotal(self):
        if not self:
            return []
        rows = self.read(["product_uom_qty", "price_unit", "tax_id"])
        env = getattr(self, "env", None)
        Tax = env.get("account.tax") if env else None
        result = []
        for r in rows:
            base = r.get("product_uom_qty", 0) * r.get("price_unit", 0)
            tax_ids = r.get("tax_id") or []
            if isinstance(tax_ids, (list, tuple)) and tax_ids and Tax:
                ids = tax_ids if isinstance(tax_ids[0], int) else [x[0] for x in tax_ids if isinstance(x, (list, tuple))]
                if ids:
                    taxes = Tax.browse(ids)
                    comp = taxes.compute_all(r.get("price_unit", 0), r.get("product_uom_qty", 1))
                    base = comp.get("total_included", base)
            result.append(base)
        return result

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
