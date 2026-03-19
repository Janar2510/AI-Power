"""Timesheet vs attendance report model (Odoo hr_timesheet_attendance parity)."""

from core.orm import Model, fields


class HrTimesheetAttendanceReport(Model):
    _name = "hr.timesheet.attendance.report"
    _description = "Timesheet Attendance Report"

    employee_id = fields.Many2one("hr.employee", string="Employee", readonly=True)
    date = fields.Date(string="Date", readonly=True)
    total_timesheet = fields.Float(string="Timesheets Time", readonly=True)
    total_attendance = fields.Float(string="Attendance Time", readonly=True)
    total_difference = fields.Float(string="Time Difference", readonly=True)
    timesheets_cost = fields.Float(string="Timesheet Cost", readonly=True)
    attendance_cost = fields.Float(string="Attendance Cost", readonly=True)
    cost_difference = fields.Float(string="Cost Difference", readonly=True)
    company_id = fields.Many2one("res.company", string="Company", readonly=True)
