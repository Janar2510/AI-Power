"""Refresh sale line purchase_price from stock moves."""

from core.orm import Model


class SaleOrderLineStockMargin(Model):
    _inherit = "sale.order.line"

    def _update_purchase_price_from_stock_move(self, move=None):
        """Update cost when a related stock move is marked done."""
        if not self:
            return False
        for line in self:
            if not line.product_id:
                continue
            prod = line.product_id
            row = prod.read(["product_template_id"])[0]
            tmpl_id = row.get("product_template_id")
            if isinstance(tmpl_id, (list, tuple)) and tmpl_id:
                tmpl_id = tmpl_id[0]
            if not tmpl_id:
                continue
            Tmpl = line.env.get("product.template")
            if not Tmpl:
                continue
            cost = Tmpl.browse(tmpl_id).read(["standard_price"])[0].get("standard_price") or 0.0
            line.write({"purchase_price": cost})
        return True
