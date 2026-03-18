"""Event model (Phase 233)."""

from core.orm import Model, fields


class EventEvent(Model):
    _name = "event.event"
    _description = "Event"

    name = fields.Char(string="Event Name", required=True)
    date_begin = fields.Datetime(string="Start Date")
    date_end = fields.Datetime(string="End Date")
    address = fields.Char(string="Address")
    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("confirmed", "Confirmed"),
            ("done", "Done"),
            ("cancel", "Cancelled"),
        ],
        string="Status",
        default="draft",
    )
