"""Extend maintenance.equipment with employee relation (Phase 287)."""

from core.orm import Model, fields


class MaintenanceEquipment(Model):
    _inherit = "maintenance.equipment"

    employee_id = fields.Many2one("hr.employee", string="Employee")
