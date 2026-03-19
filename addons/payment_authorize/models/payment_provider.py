"""Authorize provider fields (phase 342)."""

from core.orm import Model, fields


class PaymentProvider(Model):
    _inherit = "payment.provider"

    authorize_login = fields.Char(string="Authorize Login")
    authorize_transaction_key = fields.Char(string="Authorize Transaction Key")
    authorize_signature_key = fields.Char(string="Authorize Signature Key")
