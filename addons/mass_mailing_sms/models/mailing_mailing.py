"""Mass mailing SMS fields (phase 331)."""

from core.orm import Model, fields


class MailingMailing(Model):
    _inherit = "mailing.mailing"

    sms_body = fields.Text(string="SMS Body")
    sms_has_insufficient_credit = fields.Boolean(string="SMS Has Insufficient Credit", default=False)
