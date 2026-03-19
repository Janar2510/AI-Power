"""Extend hr.employee with resource calendar (Phase 238)."""

from core.orm import Model, fields


class HrEmployeeResource(Model):
    _name = "hr.employee"
    _inherit = "hr.employee"

    resource_calendar_id = fields.Many2one(
        "resource.calendar",
        string="Working Schedule",
    )
