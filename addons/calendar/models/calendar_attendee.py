"""Calendar attendee (Phase 167)."""

from core.orm import Model, fields


class CalendarAttendee(Model):
    _name = "calendar.attendee"
    _description = "Calendar Attendee"

    event_id = fields.Many2one("calendar.event", string="Event", required=True, ondelete="cascade")
    partner_id = fields.Many2one("res.partner", string="Attendee", required=True)
    state = fields.Selection(
        selection=[
            ("needs_action", "Needs Action"),
            ("accepted", "Accepted"),
            ("declined", "Declined"),
        ],
        default="needs_action",
        string="Status",
    )
