"""Expose employee skills for project task relations."""

from core.orm import Model, fields


class HrEmployee(Model):
    _inherit = "hr.employee"

    employee_skill_ids = fields.One2many("hr.employee.skill", "employee_id", string="Skills")
