"""Payslip line - one line per salary rule (Phase 186)."""

from core.orm import Model, fields


class HrPayslipLine(Model):
    _name = "hr.payslip.line"
    _description = "Payslip Line"

    slip_id = fields.Many2one("hr.payslip", string="Payslip", required=True, ondelete="cascade")
    rule_id = fields.Many2one("hr.salary.rule", string="Salary Rule", required=True)
    amount = fields.Float(required=True, default=0.0)
