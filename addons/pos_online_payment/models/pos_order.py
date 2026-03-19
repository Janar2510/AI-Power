"""POS online payment transaction link (phase 340)."""

from core.orm import Model, fields


class PosOrder(Model):
    _inherit = "pos.order"

    online_payment_transaction_id = fields.Many2one(
        "payment.transaction",
        string="Online Payment Transaction",
        ondelete="set null",
    )
