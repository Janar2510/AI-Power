"""SMS linked to calendar event."""

from core.orm import Model, fields


class SmsSms(Model):
    _inherit = "sms.sms"

    calendar_event_id = fields.Many2one("calendar.event", string="Calendar Event", ondelete="set null")
