"""Stock move (Phase 116)."""

from core.orm import Model, api, fields


class StockMove(Model):
    _name = "stock.move"
    _description = "Stock Move"

    name = fields.Char(string="Description")
    product_id = fields.Many2one("product.product", string="Product", required=True)
    product_uom_qty = fields.Float(string="Demand", default=1.0)
    quantity_reserved = fields.Float(
        string="Reserved quantity",
        default=0.0,
        help="Qty reserved on quants at source (Phase 530 partial reservation).",
    )
    lot_id = fields.Many2one("stock.lot", string="Lot/Serial", ondelete="set null")  # Phase 198
    picking_id = fields.Many2one("stock.picking", string="Transfer", ondelete="cascade")
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
        default="draft",
    )
