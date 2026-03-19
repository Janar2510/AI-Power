"""Website sale link on event registrations (phase 314)."""

from core.orm import Model, fields


class EventRegistration(Model):
    _inherit = "event.registration"

    website_event_sale_enabled = fields.Boolean(string="Website Event Sale Enabled", default=True)
