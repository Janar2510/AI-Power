"""stock.move.line — detailed lines per stock move (Phase 743)."""

from core.orm import Model, api, fields
from core.orm.api import ValidationError


class StockMoveLine(Model):
    _name = "stock.move.line"
    _description = "Stock Move Line"

    move_id = fields.Many2one("stock.move", string="Stock Move", required=True, ondelete="cascade")
    picking_id = fields.Many2one(
        "stock.picking",
        string="Transfer",
        related="move_id.picking_id",
        store=True,
        readonly=True,
    )
    product_id = fields.Many2one("product.product", string="Product", required=True)
    product_uom_id = fields.Many2one("uom.uom", string="Unit of Measure", ondelete="set null")
    quantity = fields.Float(string="Quantity", default=0.0)
    quantity_product_uom = fields.Float(string="Quantity (product UoM)", default=0.0)
    lot_id = fields.Many2one("stock.lot", string="Lot/Serial", ondelete="set null")
    lot_name = fields.Char(string="Lot Name")
    location_id = fields.Many2one("stock.location", string="Source Location", required=True)
    location_dest_id = fields.Many2one("stock.location", string="Destination Location", required=True)
    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("partial", "Partially Available"),
            ("assigned", "Available"),
            ("done", "Done"),
            ("cancel", "Cancelled"),
        ],
        string="Status",
        related="move_id.state",
        readonly=True,
    )

    @api.constrains("quantity", "move_id")
    def _check_quantity_when_move_done(self):
        Move = self.env.get("stock.move") if self.env else None
        if not Move:
            return
        for row in self.read(["quantity", "move_id"]):
            qty = float(row.get("quantity") or 0)
            mid = row.get("move_id")
            if isinstance(mid, (list, tuple)) and mid:
                mid = mid[0]
            if not mid:
                continue
            st = Move.browse(mid).read(["state"])[0].get("state")
            if st == "done" and qty < 0:
                raise ValidationError("Quantity cannot be negative when the stock move is done.")
