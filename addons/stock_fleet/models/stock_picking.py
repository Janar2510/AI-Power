"""Vehicle linkage on stock pickings (phase 311)."""

from core.orm import Model, fields


class StockPicking(Model):
    _inherit = "stock.picking"

    vehicle_id = fields.Many2one("fleet.vehicle", string="Vehicle", ondelete="set null")
