"""Calendar event work location (plan field)."""

from core.orm import Model, fields


class CalendarEvent(Model):
    _inherit = "calendar.event"

    work_location_id = fields.Many2one(
        "hr.employee.location",
        string="Work Location",
        ondelete="set null",
    )
