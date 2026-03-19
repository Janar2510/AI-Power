"""Stripe transaction fields (phase 342)."""

from core.orm import Model, fields


class PaymentTransaction(Model):
    _inherit = "payment.transaction"

    stripe_payment_intent = fields.Char(string="Stripe Payment Intent")
