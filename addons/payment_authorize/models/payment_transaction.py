"""Authorize transaction fields (phase 342)."""

from core.orm import Model, fields


class PaymentTransaction(Model):
    _inherit = "payment.transaction"

    authorize_tx_id = fields.Char(string="Authorize Tx ID")
