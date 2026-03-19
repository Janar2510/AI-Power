"""Extend hr.employee with work location (Phase 288)."""

from core.orm import Model, fields


class HrEmployee(Model):
    _inherit = "hr.employee"

    work_location_id = fields.Many2one("hr.employee.location", string="Work Location")
