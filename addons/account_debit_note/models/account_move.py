"""Extend account.move with debit-note linkage."""

from core.orm import Model, fields


class AccountMoveDebitNote(Model):
    _inherit = "account.move"

    debit_origin_id = fields.Many2one(
        "account.move",
        string="Debit Origin",
        copy=False,
        readonly=True,
    )
    debit_note_ids = fields.One2many(
        "account.move",
        "debit_origin_id",
        string="Debit Notes",
        readonly=True,
    )
