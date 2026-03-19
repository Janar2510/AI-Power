"""Overtime line: compensable as leave (Odoo hr_holidays_attendance parity)."""

from core.orm import Model, fields


class HrAttendanceOvertimeLine(Model):
    _name = "hr.attendance.overtime.line"
    _description = "Attendance Overtime Line"

    compensable_as_leave = fields.Boolean(string="Compensable as Time Off", default=False)
