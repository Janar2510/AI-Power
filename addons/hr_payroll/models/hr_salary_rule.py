"""Salary rules for payroll computation (Phase 186)."""

from core.orm import Model, fields


class HrSalaryRule(Model):
    _name = "hr.salary.rule"
    _description = "Salary Rule"
    _order = "sequence, id"

    name = fields.Char(required=True)
    code = fields.Char(required=True, string="Code")
    amount_fix = fields.Float(string="Fixed Amount", default=0.0)
    amount_percentage = fields.Float(string="Percentage", default=0.0)
    sequence = fields.Integer(default=10)
