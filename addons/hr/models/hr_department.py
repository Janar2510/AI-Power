"""HR Department model."""

from core.orm import Model, fields


class HrDepartment(Model):
    _name = "hr.department"
    _description = "Department"

    name = fields.Char(required=True)
    manager_id = fields.Many2one("hr.employee", string="Manager")
