"""Extend stock.location with production type for MRP."""

from core.orm import Model, fields


class StockLocation(Model):
    _inherit = "stock.location"

    type = fields.Selection(
        selection=[
            ("internal", "Internal"),
            ("supplier", "Supplier"),
            ("customer", "Customer"),
            ("inventory", "Inventory"),
            ("production", "Production"),
        ],
        string="Type",
        default="internal",
    )
