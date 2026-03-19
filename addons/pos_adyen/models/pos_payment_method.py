"""POS Adyen payment method fields (phase 344)."""

from core.orm import Model, fields


class PosPaymentMethod(Model):
    _name = "pos.payment.method"
    _description = "POS Payment Method"

    name = fields.Char(string="Name", default="")
    adyen_merchant_account = fields.Char(string="Adyen Merchant Account")
