"""Back-link to account move for snailmail letters (phase 313)."""

from core.orm import Model, fields


class SnailmailLetter(Model):
    _inherit = "snailmail.letter"

    account_move_id = fields.Many2one("account.move", string="Account Move", ondelete="set null")
