"""Stock location (Phase 116)."""

from core.orm import Model, fields


class StockLocation(Model):
    _name = "stock.location"
    _description = "Inventory Location"

    name = fields.Char(string="Location", required=True)
    location_id = fields.Many2one("stock.location", string="Parent Location", ondelete="cascade")
    type = fields.Selection(
        selection=[
            ("internal", "Internal"),
            ("supplier", "Supplier"),
            ("customer", "Customer"),
            ("inventory", "Inventory"),
        ],
        string="Type",
        default="internal",
    )
