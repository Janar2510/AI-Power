"""Adyen provider fields (phase 342)."""

from core.orm import Model, fields


class PaymentProvider(Model):
    _inherit = "payment.provider"

    adyen_merchant_account = fields.Char(string="Adyen Merchant Account")
    adyen_api_key = fields.Char(string="Adyen API Key")
    adyen_hmac_key = fields.Char(string="Adyen HMAC Key")
