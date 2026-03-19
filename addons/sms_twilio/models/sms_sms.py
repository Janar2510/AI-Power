"""Twilio metadata on SMS messages (phase 319)."""

from core.orm import Model, fields


class SmsSms(Model):
    _inherit = "sms.sms"

    twilio_sid = fields.Char(string="Twilio SID", default="")
