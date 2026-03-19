"""hr.resume.line (Phase 245)."""

from core.orm import Model, fields


class HrResumeLine(Model):
    _name = "hr.resume.line"
    _description = "Resume Line"

    employee_id = fields.Many2one("hr.employee", string="Employee", required=True, ondelete="cascade")
    name = fields.Char(required=True, string="Name")
    description = fields.Text(string="Description")
