"""Maintenance equipment stock lot linkage (phase 305)."""

from core.orm import Model, fields


class MaintenanceEquipment(Model):
    _inherit = "maintenance.equipment"

    lot_id = fields.Many2one("stock.lot", string="Lot", ondelete="set null")
