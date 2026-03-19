"""Event exhibitor model (phase 324)."""

from core.orm import Model, fields


class EventExhibitor(Model):
    _name = "event.exhibitor"
    _description = "Event Exhibitor"

    event_id = fields.Many2one("event.event", string="Event", ondelete="cascade")
    partner_id = fields.Many2one("res.partner", string="Partner", ondelete="set null")
    website_description = fields.Text(string="Website Description")
    website_published = fields.Boolean(string="Website Published", default=False)
