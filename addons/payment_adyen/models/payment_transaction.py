"""Adyen transaction fields (phase 342)."""

from core.orm import Model, fields


class PaymentTransaction(Model):
    _inherit = "payment.transaction"

    adyen_psp_reference = fields.Char(string="Adyen PSP Reference")
