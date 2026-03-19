"""Website fields on events (phase 314)."""

from core.orm import Model, fields


class EventEvent(Model):
    _inherit = "event.event"

    website_event_url = fields.Char(string="Website Event URL", default="")
