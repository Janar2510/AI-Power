"""Microsoft id on calendar event (phase 346)."""

from core.orm import Model, fields


class CalendarEvent(Model):
    _inherit = "calendar.event"

    microsoft_id = fields.Char(string="Microsoft ID")
