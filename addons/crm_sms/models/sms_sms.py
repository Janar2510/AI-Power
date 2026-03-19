"""Extend sms.sms with crm lead link."""

from core.orm import Model, fields


class SmsSmsCrm(Model):
    _inherit = "sms.sms"

    lead_id = fields.Many2one("crm.lead", string="Lead", copy=False)
