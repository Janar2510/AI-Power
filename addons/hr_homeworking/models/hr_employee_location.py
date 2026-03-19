"""Employee work location model (Phase 288)."""

from core.orm import Model, fields


class HrEmployeeLocation(Model):
    _name = "hr.employee.location"
    _description = "Employee Location"

    name = fields.Char(string="Location", required=True)
