"""Extend account.journal with check sequence."""

from core.orm import Model, fields


class AccountJournalCheck(Model):
    _inherit = "account.journal"

    check_manual_sequencing = fields.Boolean(
        string="Manual Numbering",
        default=False,
        help="Check if pre-printed checks are not numbered.",
    )
    check_sequence_id = fields.Many2one(
        "ir.sequence",
        string="Check Sequence",
        readonly=True,
        copy=False,
    )
