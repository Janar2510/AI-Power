"""Extend hr.employee with wage for payroll (Phase 186)."""

from core.orm import Model, fields


class HrEmployee(Model):
    _inherit = "hr.employee"

    wage = fields.Float(string="Wage", help="Base salary for payroll computation")
