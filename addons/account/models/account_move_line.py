"""Journal item (Phase 118)."""

from core.orm import Model, fields


class AccountMoveLine(Model):
    _name = "account.move.line"
    _description = "Journal Item"

    move_id = fields.Many2one("account.move", string="Journal Entry", required=True, ondelete="cascade")
    account_id = fields.Many2one("account.account", string="Account", required=True)
    name = fields.Char(string="Label")
    debit = fields.Float(string="Debit", default=0.0)
    credit = fields.Float(string="Credit", default=0.0)
    partner_id = fields.Many2one("res.partner", string="Partner")
