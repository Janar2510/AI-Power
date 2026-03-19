"""Timesheet links to time off records."""

from core.orm import Model, fields


class AccountAnalyticLineHoliday(Model):
    _inherit = "analytic.line"

    holiday_id = fields.Many2one("hr.leave", string="Time Off Request")
    global_leave_id = fields.Many2one("resource.calendar.leaves", string="Global Time Off")
