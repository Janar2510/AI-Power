"""Extend SMS with event registration link."""

from core.orm import Model, fields


class SmsSmsEvent(Model):
    _inherit = "sms.sms"

    registration_id = fields.Many2one("event.registration", string="Registration", copy=False)
