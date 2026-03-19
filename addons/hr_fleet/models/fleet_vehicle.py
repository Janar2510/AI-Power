"""Extend fleet.vehicle with employee relation (Phase 287)."""

from core.orm import Model, fields


class FleetVehicle(Model):
    _inherit = "fleet.vehicle"

    employee_id = fields.Many2one("hr.employee", string="Employee")
