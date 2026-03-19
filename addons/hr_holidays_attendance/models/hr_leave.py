"""Time off ↔ attendances (plan: attendance_ids)."""

from core.orm import Model, fields


class HrLeave(Model):
    _inherit = "hr.leave"

    attendance_ids = fields.One2many(
        "hr.attendance",
        "leave_id",
        string="Attendances",
    )
