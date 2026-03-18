"""Event registration (Phase 233)."""

from core.orm import Model, fields


class EventRegistration(Model):
    _name = "event.registration"
    _description = "Event Registration"

    event_id = fields.Many2one("event.event", string="Event", required=True)
    partner_id = fields.Many2one("res.partner", string="Attendee")
    email = fields.Char(string="Email")
    state = fields.Selection(
        selection=[
            ("draft", "Unconfirmed"),
            ("open", "Registered"),
            ("done", "Attended"),
            ("cancel", "Cancelled"),
        ],
        string="Status",
        default="draft",
    )
