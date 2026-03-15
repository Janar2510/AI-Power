"""Stock move (Phase 116)."""

from core.orm import Model, api, fields


class StockMove(Model):
    _name = "stock.move"
    _description = "Stock Move"

    name = fields.Char(string="Description")
    product_id = fields.Many2one("product.product", string="Product", required=True)
    product_uom_qty = fields.Float(string="Demand", default=1.0)
    picking_id = fields.Many2one("stock.picking", string="Transfer", ondelete="cascade")
    location_id = fields.Many2one("stock.location", string="Source Location", required=True)
    location_dest_id = fields.Many2one("stock.location", string="Destination Location", required=True)
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
