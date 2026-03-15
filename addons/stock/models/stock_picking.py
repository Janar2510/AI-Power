"""Stock picking / transfer (Phase 116)."""

from core.orm import Model, fields


class StockPicking(Model):
    _name = "stock.picking"
    _description = "Transfer"

    name = fields.Char(string="Reference", required=True, default="New")
    picking_type_id = fields.Many2one("stock.picking.type", string="Operation Type", required=True)
    partner_id = fields.Many2one("res.partner", string="Partner")
    location_id = fields.Many2one("stock.location", string="Source Location", required=True)
    location_dest_id = fields.Many2one("stock.location", string="Destination Location", required=True)
    move_ids = fields.One2many(
        "stock.move",
        "picking_id",
        string="Moves",
    )
    origin = fields.Char(string="Source")

    def action_confirm(self):
        """Validate transfer: set picking and moves to done."""
        for rec in self:
            rec.write({"state": "done"})
            if rec.move_ids:
                rec.move_ids.write({"state": "done"})

    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("assigned", "Available"),
            ("done", "Done"),
            ("cancel", "Cancelled"),
        ],
        string="Status",
        default="draft",
    )
