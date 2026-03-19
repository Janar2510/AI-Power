"""Event mass mailing bridge fields (phase 330)."""

from core.orm import Model, fields


class EventEvent(Model):
    _inherit = "event.event"

    mass_mailing_ids = fields.One2many("mailing.mailing", "event_id", string="Mass Mailings")
