"""Mollie provider fields (phase 343)."""

from core.orm import Model, fields


class PaymentProvider(Model):
    _inherit = "payment.provider"

    mollie_api_key = fields.Char(string="Mollie API Key")
