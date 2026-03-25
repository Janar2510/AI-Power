"""res.company - Company (Phase 90 multi-company)."""

from core.orm import Model, fields


class ResCompany(Model):
    _name = "res.company"
    _description = "Company"

    name = fields.Char(required=True, string="Company Name")
    currency_id = fields.Many2one("res.currency", string="Currency")
    parent_id = fields.Many2one("res.company", string="Parent Company")
    child_ids = fields.One2many("res.company", "parent_id", string="Child Companies")
    logo = fields.Binary(string="Logo")
    email = fields.Char(string="Email")
    phone = fields.Char(string="Phone")
    street = fields.Char(string="Street")
    city = fields.Char(string="City")
    country_id = fields.Many2one("res.country", string="Country")
    stock_valuation_auto_account_move = fields.Boolean(
        string="Stock valuation draft moves",
        default=False,
        help="Phase 571 Tier C: when account is installed, outgoing FIFO COGS may create a draft "
        "account.move stub (best-effort; requires journals/accounts).",
    )
    stock_valuation_allow_negative = fields.Boolean(
        string="Allow negative stock valuation",
        default=True,
        help="Phase 582: when False, outgoing moves error if FIFO/AVCO cannot cover qty.",
    )
