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
    amount_currency = fields.Float(string="Amount Currency", default=0.0)
    currency_id = fields.Many2one("res.currency", string="Currency")
    partner_id = fields.Many2one("res.partner", string="Partner")
    analytic_account_id = fields.Many2one("analytic.account", string="Analytic Account")
    tax_ids = fields.Many2many("account.tax", string="Taxes", help="Phase 181")
