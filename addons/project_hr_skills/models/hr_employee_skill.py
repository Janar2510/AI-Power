"""Employee skill line (minimal for project_hr_skills bridge)."""

from core.orm import Model, fields


class HrEmployeeSkill(Model):
    _name = "hr.employee.skill"
    _description = "Employee Skill"

    employee_id = fields.Many2one("hr.employee", string="Employee", required=True, ondelete="cascade")
    skill_id = fields.Many2one("hr.skill", string="Skill", ondelete="set null")
