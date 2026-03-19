"""Extend hr.employee with fleet vehicles (Phase 287)."""

from core.orm import Model, fields


class HrEmployee(Model):
    _inherit = "hr.employee"

    vehicle_ids = fields.One2many(
        "fleet.vehicle",
        "employee_id",
        string="Vehicles",
    )
