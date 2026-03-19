"""Employee ↔ attendance on leave (plan: attendance_leave_count)."""

from core.orm import Model, api, fields


class HrEmployee(Model):
    _inherit = "hr.employee"

    attendance_leave_count = fields.Computed(
        compute="_compute_attendance_leave_count",
        store=False,
        string="Attendance Leave Count",
    )

    @api.depends()
    def _compute_attendance_leave_count(self):
        return [0] * len(self._ids)
