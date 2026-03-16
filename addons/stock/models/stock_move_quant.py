"""Extend stock.move with quant updates on done (Phase 150)."""

from core.orm import Model
from core.orm.models import ModelBase


class StockMove(Model):
    _inherit = "stock.move"

    def write(self, vals):
        res = ModelBase.write(self, vals)
        if vals.get("state") == "done":
            self._update_quants()
        return res

    def _update_quants(self):
        """Update quants when move is done: decrease source, increase dest."""
        Quant = self.env.get("stock.quant")
        Location = self.env.get("stock.location")
        if not Quant or not Location:
            return
        internal_ids = [r["id"] for r in Location.search_read([("type", "=", "internal")], ["id"])]
        if not internal_ids:
            return
        for move in self:
            row = move.read(["product_id", "location_id", "location_dest_id", "product_uom_qty"])[0]
            pid = row.get("product_id")
            src_id = row.get("location_id")
            dest_id = row.get("location_dest_id")
            qty = row.get("product_uom_qty", 0)
            if not pid or qty <= 0:
                continue
            pid = pid[0] if isinstance(pid, (list, tuple)) else pid
            src_id = src_id[0] if isinstance(src_id, (list, tuple)) else src_id
            dest_id = dest_id[0] if isinstance(dest_id, (list, tuple)) else dest_id
            if src_id and src_id in internal_ids:
                quants = Quant.search([("product_id", "=", pid), ("location_id", "=", src_id), ("lot_id", "=", False)], limit=1)
                if quants.ids:
                    cur = quants.read(["quantity"])[0].get("quantity", 0)
                    Quant.browse(quants.ids).write({"quantity": max(0, cur - qty)})
            if dest_id and dest_id in internal_ids:
                quants = Quant.search([("product_id", "=", pid), ("location_id", "=", dest_id), ("lot_id", "=", False)], limit=1)
                if quants.ids:
                    cur = quants.read(["quantity"])[0].get("quantity", 0)
                    Quant.browse(quants.ids).write({"quantity": cur + qty})
                else:
                    Quant.create({"product_id": pid, "location_id": dest_id, "quantity": qty})
