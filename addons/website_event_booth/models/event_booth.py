"""Website booth page field (phase 315)."""

from core.orm import Model, fields


class EventBooth(Model):
    _inherit = "event.booth"

    website_event_booth_page_url = fields.Char(string="Website Booth Page URL", default="")
