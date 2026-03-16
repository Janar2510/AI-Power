"""Manufacturing Order (Phase 153)."""

from core.orm import Model, fields


class MrpProduction(Model):
    _name = "mrp.production"
    _description = "Manufacturing Order"

    name = fields.Char(string="Reference", readonly=True)
    product_id = fields.Many2one("product.product", string="Product", required=True)
    bom_id = fields.Many2one("mrp.bom", string="Bill of Materials")
    product_qty = fields.Float(string="Quantity", default=1.0)
    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("confirmed", "Confirmed"),
            ("progress", "In Progress"),
            ("done", "Done"),
            ("cancel", "Cancelled"),
        ],
        string="Status",
        default="draft",
        readonly=True,
    )
    move_ids = fields.One2many("stock.move", "production_id", string="Moves")

    @classmethod
    def create(cls, vals):
        if not vals.get("name") or vals.get("name") == "New":
            env = getattr(cls._registry, "_env", None)
            if env:
                seq = env.get("ir.sequence")
                if seq:
                    next_val = seq.next_by_code("mrp.production")
                    if next_val is not None:
                        vals = dict(vals, name=f"MO/{next_val:05d}")
        return super().create(vals)

    def action_confirm(self):
        """Create stock moves for raw materials and finished goods."""
        for rec in self:
            state = rec.read(["state"])[0].get("state") if rec.ids else None
            if state != "draft":
                continue
            env = getattr(rec, "env", None)
            if not env:
                continue
            Location = env.get("stock.location")
            Move = env.get("stock.move")
            if not Location or not Move:
                continue
            # Get stock (internal) and production locations
            stock_locs = Location.search([("type", "=", "internal")], limit=2)
            prod_locs = Location.search([("type", "=", "production")], limit=1)
            if not stock_locs.ids:
                continue
            stock_id = stock_locs.ids[0]
            if prod_locs.ids:
                prod_id = prod_locs.ids[0]
            elif len(stock_locs.ids) >= 2:
                prod_id = stock_locs.ids[1]  # Use second internal as WIP fallback
            else:
                continue
            # Raw materials: internal -> production
            rec_data = rec.read(["bom_id", "product_id", "product_qty", "name"])[0]
            bom_id = rec_data.get("bom_id")
            if isinstance(bom_id, (list, tuple)) and bom_id:
                bom_id = bom_id[0]
            prod_name = rec_data.get("name") or "New"
            if bom_id:
                Bom = env.get("mrp.bom")
                bom_data = Bom.browse(bom_id).read(["bom_line_ids"])[0]
                line_ids = bom_data.get("bom_line_ids") or []
                if line_ids and isinstance(line_ids[0], (list, tuple)):
                    line_ids = [x[0] for x in line_ids if x]
                for lid in line_ids or []:
                    line = env.get("mrp.bom.line").browse(lid)
                    line_vals = line.read(["product_id", "product_qty"])[0]
                    pid = line_vals.get("product_id")
                    rec_qty = rec_data.get("product_qty", 1)
                    qty = line_vals.get("product_qty", 1) * rec_qty
                    if isinstance(pid, (list, tuple)):
                        pid = pid[0] if pid else None
                    if pid:
                        Move.create({
                            "name": f"MO {prod_name}",
                            "product_id": pid,
                            "product_uom_qty": qty,
                            "location_id": stock_id,
                            "location_dest_id": prod_id,
                            "state": "draft",
                            "production_id": rec.ids[0] if rec.ids else None,
                        })
            # Finished product: production -> internal
            prod_id_val = rec_data.get("product_id")
            product_id = prod_id_val[0] if isinstance(prod_id_val, (list, tuple)) and prod_id_val else prod_id_val
            Move.create({
                "name": f"MO {prod_name}",
                "product_id": product_id,
                "product_uom_qty": rec_data.get("product_qty", 1),
                "location_id": prod_id,
                "location_dest_id": stock_id,
                "state": "draft",
                "production_id": rec.ids[0] if rec.ids else None,
            })
            rec.write({"state": "confirmed"})
        return True

    def action_start(self):
        for rec in self:
            state = rec.read(["state"])[0].get("state") if rec.ids else None
            if state == "confirmed":
                rec.write({"state": "progress"})
        return True

    def action_done(self):
        """Validate moves and update quants."""
        for rec in self:
            state = rec.read(["state"])[0].get("state") if rec.ids else None
            if state != "progress":
                continue
            env = getattr(rec, "env", None)
            if not env:
                continue
            Move = env.get("stock.move")
            if Move:
                move_data = rec.read(["move_ids"])[0]
                move_ids = move_data.get("move_ids") or []
                if move_ids and isinstance(move_ids[0], (list, tuple)):
                    move_ids = [x[0] for x in move_ids if x]
                else:
                    move_ids = [x for x in move_ids if isinstance(x, int)]
                for mid in move_ids:
                    Move.browse(mid).write({"state": "done"})
            rec.write({"state": "done"})
        return True

    def action_cancel(self):
        for rec in self:
            state = rec.read(["state"])[0].get("state") if rec.ids else None
            if state in ("draft", "confirmed", "progress"):
                rec.write({"state": "cancel"})
        return True
