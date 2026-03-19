"""PayPal provider fields (phase 342)."""

from core.orm import Model, fields


class PaymentProvider(Model):
    _inherit = "payment.provider"

    paypal_email_account = fields.Char(string="PayPal Email Account")
    paypal_pdt_token = fields.Char(string="PayPal PDT Token")
    paypal_use_ipn = fields.Boolean(string="PayPal Use IPN", default=False)
