"""Stock warehouse orderpoint - reordering rules (Phase 189)."""

from core.orm import Model, fields


class StockWarehouseOrderpoint(Model):
    _name = "stock.warehouse.orderpoint"
    _description = "Reordering Rule"

    name = fields.Char(string="Name")
    product_id = fields.Many2one("product.product", string="Product", required=True)
    location_id = fields.Many2one("stock.location", string="Location", required=True)
    product_min_qty = fields.Float(string="Min. Quantity", default=0.0)
    product_max_qty = fields.Float(string="Max. Quantity", default=0.0)
    qty_multiple = fields.Float(string="Qty Multiple", default=1.0)
    partner_id = fields.Many2one("res.partner", string="Vendor", help="When set, creates purchase order; else creates stock move")

    def _procure_orderpoint_confirm(self):
        """Create purchase.order or stock.move when qty below min (Phase 189)."""
        env = getattr(self, "env", None) or (
            getattr(self._model._registry, "_env", None)
            if getattr(self._model, "_registry", None)
            else None
        )
        if not env:
            return
        Quant = env.get("stock.quant")
        Product = env.get("product.product")
        Location = env.get("stock.location")
        if not Quant or not Product or not Location:
            return
        ids = self.ids if hasattr(self, "ids") and self.ids else (getattr(self, "_ids", None) or [])
        if not ids:
            ids = [self.id] if hasattr(self, "id") and self.id else []
        for oid in ids:
            rec = self._model.browse(oid)
            row = rec.read(["product_id", "location_id", "product_min_qty", "product_max_qty", "qty_multiple", "partner_id"])[0] if rec.read(["product_id", "location_id", "product_min_qty", "product_max_qty", "qty_multiple", "partner_id"]) else {}
            pid = row.get("product_id")
            if isinstance(pid, (list, tuple)) and pid:
                pid = pid[0]
            loc_id = row.get("location_id")
            if isinstance(loc_id, (list, tuple)) and loc_id:
                loc_id = loc_id[0]
            min_qty = float(row.get("product_min_qty") or 0)
            max_qty = float(row.get("product_max_qty") or 0)
            qty_mult = float(row.get("qty_multiple") or 1.0) or 1.0
            partner_id = row.get("partner_id")
            if isinstance(partner_id, (list, tuple)) and partner_id:
                partner_id = partner_id[0]
            if not pid or not loc_id:
                continue
            quants = Quant.search_read([("product_id", "=", pid), ("location_id", "=", loc_id)], ["quantity"])
            qty = sum(float(r.get("quantity") or 0) for r in quants)
            if qty >= min_qty:
                continue
            to_order = max_qty - qty if max_qty > 0 else min_qty - qty
            if to_order <= 0:
                continue
            if qty_mult > 0:
                import math
                to_order = math.ceil(to_order / qty_mult) * qty_mult
            if to_order <= 0:
                continue
            if partner_id:
                PurchaseOrder = env.get("purchase.order")
                PurchaseLine = env.get("purchase.order.line")
                if PurchaseOrder and PurchaseLine:
                    po = PurchaseOrder.create({
                        "partner_id": partner_id,
                        "order_line": [{
                            "product_id": pid,
                            "product_qty": to_order,
                            "price_unit": 0.0,
                        }],
                    })
                    if rec.name:
                        po.write({"origin": rec.name})
            else:
                Move = env.get("stock.move")
                supplier_locs = Location.search([("type", "=", "supplier")], limit=1)
                src_loc = supplier_locs.ids[0] if supplier_locs.ids else None
                if not src_loc:
                    internal = Location.search([("type", "=", "internal")], limit=1)
                    src_loc = internal.ids[0] if internal.ids else None
                if Move and src_loc and loc_id:
                    prod_name = Product.browse(pid).read(["name"])[0].get("name", "Product") if Product else "Product"
                    Move.create({
                        "name": f"Replenish: {prod_name}",
                        "product_id": pid,
                        "product_uom_qty": to_order,
                        "location_id": src_loc,
                        "location_dest_id": loc_id,
                        "state": "draft",
                    })
