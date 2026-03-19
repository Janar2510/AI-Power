"""PayPal transaction fields (phase 342)."""

from core.orm import Model, fields


class PaymentTransaction(Model):
    _inherit = "payment.transaction"

    paypal_txn_id = fields.Char(string="PayPal Txn ID")
