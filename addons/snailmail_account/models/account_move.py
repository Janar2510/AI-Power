"""Snailmail links on account moves (phase 313)."""

from core.orm import Model, fields


class AccountMove(Model):
    _inherit = "account.move"

    snailmail_letter_ids = fields.One2many("snailmail.letter", "account_move_id", string="Snailmail Letters")
