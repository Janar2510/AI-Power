"""Extend account.move with payment_ids."""

from core.orm import Model, fields


class AccountMovePayment(Model):
    _inherit = "account.move"

    payment_ids = fields.One2many(
        "account.payment",
        "move_id",
        string="Payments",
    )
