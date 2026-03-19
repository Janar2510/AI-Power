"""Google id on calendar event (phase 345)."""

from core.orm import Model, fields


class CalendarEvent(Model):
    _inherit = "calendar.event"

    google_id = fields.Char(string="Google ID")
