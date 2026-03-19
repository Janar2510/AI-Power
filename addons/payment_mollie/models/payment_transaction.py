"""Mollie transaction fields (phase 343)."""

from core.orm import Model, fields


class PaymentTransaction(Model):
    _inherit = "payment.transaction"

    mollie_payment_id = fields.Char(string="Mollie Payment ID")
