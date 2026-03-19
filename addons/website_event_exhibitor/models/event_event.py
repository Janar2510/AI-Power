"""Exhibitor links on events (phase 324)."""

from core.orm import Model, fields


class EventEvent(Model):
    _inherit = "event.event"

    exhibitor_ids = fields.One2many("event.exhibitor", "event_id", string="Exhibitors")
