"""Extend hr.employee with maintenance equipment (Phase 287)."""

from core.orm import Model, fields


class HrEmployee(Model):
    _inherit = "hr.employee"

    equipment_ids = fields.One2many(
        "maintenance.equipment",
        "employee_id",
        string="Equipment",
    )
