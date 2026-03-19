"""Global time off model used by project_timesheet_holidays."""

from core.orm import Model, fields


class ResourceCalendarLeaves(Model):
    _name = "resource.calendar.leaves"
    _description = "Global Time Off"

    name = fields.Char(required=True)
    date_from = fields.Date(string="Start")
    date_to = fields.Date(string="End")
    calendar_id = fields.Many2one("resource.calendar", string="Working Schedule")
    company_id = fields.Many2one("res.company", string="Company")
    timesheet_ids = fields.One2many("analytic.line", "global_leave_id", string="Timesheets")
