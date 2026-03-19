"""Custom provider fields (phase 343)."""

from core.orm import Model, fields


class PaymentProvider(Model):
    _inherit = "payment.provider"

    custom_instructions = fields.Text(string="Custom Instructions")
