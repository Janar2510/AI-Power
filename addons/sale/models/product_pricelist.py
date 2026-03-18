"""Product pricelist (Phase 187)."""

from datetime import date
from core.orm import Model, fields


class ProductPricelist(Model):
    _name = "product.pricelist"
    _description = "Pricelist"

    name = fields.Char(required=True)
    currency_id = fields.Many2one("res.currency", string="Currency")
    item_ids = fields.One2many(
        "product.pricelist.item",
        "pricelist_id",
        string="Pricelist Items",
    )

    def get_product_price(self, product, qty, partner=None):
        """Return price for product at qty. Uses first matching item or product list_price."""
        if not product:
            return 0.0
        env = getattr(self, "env", None) or (getattr(self._model._registry, "_env", None) if getattr(self._model, "_registry", None) else None)
        if not env:
            return 0.0
        Product = env.get("product.product")
        if not Product:
            return 0.0
        pid = product if isinstance(product, int) else (product.id if hasattr(product, "id") else (product.ids[0] if getattr(product, "ids", None) else product))
        if not pid:
            return 0.0
        rows = Product.browse([pid]).read(["list_price", "product_template_id"]) if Product else []
        list_price = float(rows[0].get("list_price") or 0) if rows else 0.0
        if list_price == 0 and rows:
            tid = rows[0].get("product_template_id")
            if isinstance(tid, (list, tuple)) and tid:
                tid = tid[0]
            if tid:
                Template = env.get("product.template")
                if Template:
                    trows = Template.search_read([("id", "=", tid)], ["list_price"])
                    if trows:
                        list_price = float(trows[0].get("list_price") or 0)
        Item = env.get("product.pricelist.item")
        if not Item or not self.ids:
            return list_price
        today = date.today().isoformat()
        pl_id = self.ids[0] if self.ids else (self.id if getattr(self, "id", None) else None)
        if not pl_id:
            return list_price
        items = Item.search([
            ("pricelist_id", "=", pl_id),
            ["|", ("product_id", "=", False), ("product_id", "=", pid)],
        ], order="min_qty desc, id")
        for item in items:
            row = item.read(["min_qty", "price_surcharge", "percent_price", "product_id"])[0]
            min_qty = float(row.get("min_qty") or 0)
            if qty < min_qty:
                continue
            prod_id = row.get("product_id")
            if isinstance(prod_id, (list, tuple)) and prod_id:
                prod_id = prod_id[0]
            if prod_id is not None and prod_id is not False and prod_id != pid:
                continue
            surcharge = float(row.get("price_surcharge") or 0)
            pct = float(row.get("percent_price") or 0)
            return list_price * (1 + pct / 100.0) + surcharge
        return list_price
