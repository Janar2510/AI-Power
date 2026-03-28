"""stock.scrap — remove inventory to scrap location (Phase 748)."""

from core.orm import Model, fields


class StockMove(Model):
    _inherit = "stock.move"

    scrap_id = fields.Many2one("stock.scrap", string="Scrap Order", ondelete="set null")


class StockScrap(Model):
    _name = "stock.scrap"
    _description = "Scrap"

    name = fields.Char(string="Reference", default="New")
    product_id = fields.Many2one("product.product", string="Product", required=True)
    lot_id = fields.Many2one("stock.lot", string="Lot/Serial", ondelete="set null")
    scrap_qty = fields.Float(string="Quantity", default=1.0, required=True)
    product_uom_id = fields.Many2one("uom.uom", string="Unit of Measure")
    location_id = fields.Many2one("stock.location", string="Source Location", required=True)
    scrap_location_id = fields.Many2one("stock.location", string="Scrap Location", required=True)
    picking_id = fields.Many2one("stock.picking", string="Transfer", ondelete="set null")
    move_ids = fields.One2many("stock.move", "scrap_id", string="Stock Moves")
    state = fields.Selection(
        selection=[("draft", "Draft"), ("done", "Done")],
        string="Status",
        default="draft",
    )

    @classmethod
    def _create_stock_scrap_record(cls, vals):
        if vals.get("name") in (None, "", "New"):
            env = getattr(cls._registry, "_env", None) if cls._registry else None
            IrSequence = env.get("ir.sequence") if env else None
            next_val = IrSequence.next_by_code("stock.scrap") if IrSequence else None
            vals = dict(vals, name=("SC/%s" % next_val) if next_val is not None else "New")
        return super().create(vals)

    @classmethod
    def create(cls, vals):
        return cls._create_stock_scrap_record(vals)

    def action_validate(self):
        """Create a done stock.move from source to scrap location; updates quants via stock.move write."""
        env = getattr(self, "env", None)
        if not env or not self.ids:
            return False
        Move = env.get("stock.move")
        Product = env.get("product.product")
        if not Move or not Product:
            return False
        for rec in self:
            row = rec.read(
                [
                    "state",
                    "product_id",
                    "scrap_qty",
                    "location_id",
                    "scrap_location_id",
                    "picking_id",
                    "lot_id",
                    "product_uom_id",
                    "name",
                ]
            )[0]
            if row.get("state") != "draft":
                continue
            pid = row.get("product_id")
            pid = pid[0] if isinstance(pid, (list, tuple)) and pid else pid
            src = row.get("location_id")
            src = src[0] if isinstance(src, (list, tuple)) and src else src
            dest = row.get("scrap_location_id")
            dest = dest[0] if isinstance(dest, (list, tuple)) and dest else dest
            qty = float(row.get("scrap_qty") or 0)
            if not pid or not src or not dest or qty <= 0:
                continue
            pick = row.get("picking_id")
            pick_id = pick[0] if isinstance(pick, (list, tuple)) and pick else (pick or False)
            lot = row.get("lot_id")
            lot_id = lot[0] if isinstance(lot, (list, tuple)) and lot else (lot or False)
            uom = row.get("product_uom_id")
            uom_id = uom[0] if isinstance(uom, (list, tuple)) and uom else uom
            if not uom_id:
                prow = Product.browse([pid]).read(["uom_id"])[0]
                ur = prow.get("uom_id")
                uom_id = ur[0] if isinstance(ur, (list, tuple)) and ur else ur
            ref = row.get("name") or "Scrap"
            move = Move.create({
                "name": ref,
                "product_id": pid,
                "product_uom_qty": qty,
                "location_id": src,
                "location_dest_id": dest,
                "picking_id": pick_id or None,
                "lot_id": lot_id or None,
                "scrap_id": rec.ids[0] if rec.ids else None,
                "state": "draft",
            })
            mid = move.id if hasattr(move, "id") else (move.ids[0] if getattr(move, "ids", None) else None)
            if mid:
                Move.browse([mid]).write({"state": "done"})
            rec.write({"state": "done"})
        return True
