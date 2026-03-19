"""Stripe provider fields (phase 342)."""

from core.orm import Model, fields


class PaymentProvider(Model):
    _inherit = "payment.provider"

    stripe_secret_key = fields.Char(string="Stripe Secret Key")
    stripe_publishable_key = fields.Char(string="Stripe Publishable Key")
    stripe_webhook_secret = fields.Char(string="Stripe Webhook Secret")
