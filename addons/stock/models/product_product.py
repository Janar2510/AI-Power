"""Extend product.product with qty_available (Phase 116)."""

from core.orm import Model, api, fields


class ProductProduct(Model):
    _inherit = "product.product"

    qty_available = fields.Computed(
        compute="_compute_qty_available",
        string="On Hand",
    )

    @api.depends()
    def _compute_qty_available(self):
        """Compute quantity from done stock moves. Stock location = internal type."""
        if not self:
            return []
        try:
            Location = self.env["stock.location"]
            Move = self.env["stock.move"]
        except KeyError:
            return [0.0] * len(self)
        stock_locs = Location.search_read([("type", "=", "internal")], ["id"])
        stock_ids = [r["id"] for r in stock_locs]
        if not stock_ids:
            return [0.0] * len(self)
        result = []
        for rec in self:
            pid = rec.id
            domain_in = [
                ("product_id", "=", pid),
                ("state", "=", "done"),
                ("location_dest_id", "in", stock_ids),
            ]
            domain_out = [
                ("product_id", "=", pid),
                ("state", "=", "done"),
                ("location_id", "in", stock_ids),
            ]
            rows_in = Move.search_read(domain_in, ["product_uom_qty"])
            rows_out = Move.search_read(domain_out, ["product_uom_qty"])
            qty_in = sum(r.get("product_uom_qty", 0) for r in rows_in)
            qty_out = sum(r.get("product_uom_qty", 0) for r in rows_out)
            result.append(qty_in - qty_out)
        return result
