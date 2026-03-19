"""Time off work location (plan field)."""

from core.orm import Model, fields


class HrLeave(Model):
    _inherit = "hr.leave"

    work_location_id = fields.Many2one(
        "hr.employee.location",
        string="Work Location",
        ondelete="set null",
    )
