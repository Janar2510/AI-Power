"""Calendar SMS bridge fields (phase 303)."""

from core.orm import Model, api, fields


class CalendarEvent(Model):
    _inherit = "calendar.event"

    sms_ids = fields.One2many("sms.sms", "calendar_event_id", string="SMS Messages")
    sms_reminder_ids = fields.One2many(
        "sms.sms",
        "calendar_event_id",
        string="SMS Reminders",
    )
    sms_count = fields.Computed(
        compute="_compute_sms_count",
        store=False,
        string="SMS Count",
    )

    @api.depends("sms_ids")
    def _compute_sms_count(self):
        return [0] * len(self._ids)
