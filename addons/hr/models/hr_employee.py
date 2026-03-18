"""HR Employee model."""

from core.orm import Model, fields


class HrEmployee(Model):
    _name = "hr.employee"
    _audit = True  # Phase 205
    _description = "Employee"

    name = fields.Char(required=True)
    department_id = fields.Many2one("hr.department", string="Department")
    job_id = fields.Many2one("hr.job", string="Job Position")
    work_email = fields.Char(string="Work Email")
    user_id = fields.Many2one("res.users", string="User")
