"""Timesheet line cost (plan: timesheet_cost Float)."""

from core.orm import Model, fields


class AnalyticLine(Model):
    _inherit = "analytic.line"

    timesheet_cost = fields.Float(string="Timesheet Cost", default=0.0)
