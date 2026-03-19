"""Demo provider fields (phase 343)."""

from core.orm import Model, fields


class PaymentProvider(Model):
    _inherit = "payment.provider"

    demo_always_succeed = fields.Boolean(string="Demo Always Succeed", default=True)
