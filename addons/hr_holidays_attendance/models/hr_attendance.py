"""Attendance ↔ time off."""

from core.orm import Model, fields


class HrAttendance(Model):
    _inherit = "hr.attendance"

    leave_id = fields.Many2one("hr.leave", string="Time Off", ondelete="set null")
