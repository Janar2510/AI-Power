"""Extend stock.move with quant updates on done (Phase 150), valuation layers (Phase 173)."""

from core.orm import Model
from core.orm.models import ModelBase


class StockMove(Model):
    _inherit = "stock.move"

    def write(self, vals):
        res = ModelBase.write(self, vals)
        if vals.get("state") == "done":
            self._update_quants()
            self._create_valuation_layers()
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

    def _create_valuation_layers(self):
        """Phase 173: Create stock.valuation.layer on done moves (in/out of internal)."""
        Layer = self.env.get("stock.valuation.layer")
        Location = self.env.get("stock.location")
        Product = self.env.get("product.product")
        if not Layer or not Location or not Product:
            return
        internal_ids = [r["id"] for r in Location.search_read([("type", "=", "internal")], ["id"])]
        if not internal_ids:
            return
        for move in self:
            row = move.read(["product_id", "location_id", "location_dest_id", "product_uom_qty", "name"])[0]
            pid = row.get("product_id")
            src_id = row.get("location_id")
            dest_id = row.get("location_dest_id")
            qty = row.get("product_uom_qty", 0)
            name = row.get("name") or ""
            if not pid or qty <= 0:
                continue
            pid = pid[0] if isinstance(pid, (list, tuple)) else pid
            src_id = src_id[0] if isinstance(src_id, (list, tuple)) else src_id
            dest_id = dest_id[0] if isinstance(dest_id, (list, tuple)) else dest_id
            move_id = move.id if hasattr(move, "id") else (move.ids[0] if move.ids else None)
            prod_rows = Product.browse([pid]).read(["standard_price", "cost_method"])
            unit_cost = prod_rows[0].get("standard_price", 0) if prod_rows else 0
            cost_method = prod_rows[0].get("cost_method", "standard") if prod_rows else "standard"
            src_internal = src_id in internal_ids
            dest_internal = dest_id in internal_ids
            if src_internal and not dest_internal:
                # Outgoing: negative layer
                Layer.create({
                    "product_id": pid,
                    "quantity": -qty,
                    "unit_cost": unit_cost,
                    "value": -qty * unit_cost,
                    "stock_move_id": move_id,
                    "description": f"Out: {name}",
                })
            elif dest_internal and not src_internal:
                # Incoming: positive layer; for average, update product cost
                if cost_method == "average":
                    # Weighted average: (old_val + in_qty*in_cost) / (old_qty + in_qty)
                    # cur_qty from quants already includes this move; old_qty = cur_qty - qty
                    Quant = self.env.get("stock.quant")
                    cur_qty = 0.0
                    cur_val = 0.0
                    if Quant:
                        quants = Quant.search_read(
                            [("product_id", "=", pid), ("location_id", "in", internal_ids)],
                            ["quantity"],
                        )
                        cur_qty = sum(r.get("quantity", 0) for r in quants)
                        layers = Layer.search_read(
                            [("product_id", "=", pid)],
                            ["quantity", "value"],
                        )
                        cur_val = sum(r.get("value", 0) for r in layers)
                    in_val = qty * unit_cost
                    new_qty = cur_qty  # already includes this move
                    new_val = cur_val + in_val
                    unit_cost = (new_val / new_qty) if new_qty else unit_cost
                    Product.browse([pid]).write({"standard_price": unit_cost})
                Layer.create({
                    "product_id": pid,
                    "quantity": qty,
                    "unit_cost": unit_cost,
                    "value": qty * unit_cost,
                    "stock_move_id": move_id,
                    "description": f"In: {name}",
                })
