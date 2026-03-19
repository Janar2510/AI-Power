"""Razorpay transaction fields (phase 343)."""

from core.orm import Model, fields


class PaymentTransaction(Model):
    _inherit = "payment.transaction"

    razorpay_payment_id = fields.Char(string="Razorpay Payment ID")
