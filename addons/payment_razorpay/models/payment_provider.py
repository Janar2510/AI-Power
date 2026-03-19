"""Razorpay provider fields (phase 343)."""

from core.orm import Model, fields


class PaymentProvider(Model):
    _inherit = "payment.provider"

    razorpay_key_id = fields.Char(string="Razorpay Key ID")
    razorpay_key_secret = fields.Char(string="Razorpay Key Secret")
