"""POS SMS receipt field (phase 340)."""

from core.orm import Model, fields


class PosOrder(Model):
    _inherit = "pos.order"

    sms_receipt_sent = fields.Boolean(string="SMS Receipt Sent", default=False)
