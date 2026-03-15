"""Chart of accounts (Phase 118)."""

from core.orm import Model, fields


class AccountAccount(Model):
    _name = "account.account"
    _description = "Account"

    name = fields.Char(string="Name", required=True)
    code = fields.Char(string="Code", required=True)
    account_type = fields.Selection(
        selection=[
            ("asset_receivable", "Receivable"),
            ("asset_cash", "Bank and Cash"),
            ("asset_current", "Current Assets"),
            ("income", "Income"),
            ("expense", "Expense"),
            ("liability_payable", "Payable"),
        ],
        string="Type",
    )
