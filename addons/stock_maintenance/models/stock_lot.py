"""Stock lot maintenance linkage (phase 305)."""

from core.orm import Model, fields


class StockLot(Model):
    _inherit = "stock.lot"

    equipment_ids = fields.One2many("maintenance.equipment", "lot_id", string="Equipment")
