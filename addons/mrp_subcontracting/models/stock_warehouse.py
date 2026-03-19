"""Extend stock.warehouse with subcontracting location (Phase 253)."""

from core.orm import Model, fields


class StockWarehouse(Model):
    _inherit = "stock.warehouse"

    subcontracting_location_id = fields.Many2one(
        "stock.location",
        string="Subcontracting Location",
    )
