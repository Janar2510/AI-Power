"""Account chart template model (phase 350)."""

from core.orm import Model, fields


class AccountChartTemplate(Model):
    _name = "account.chart.template"
    _description = "Account Chart Template"

    name = fields.Char(string="Name", default="")
    code = fields.Char(string="Code")
    country_id = fields.Many2one("res.country", string="Country", ondelete="set null")
    currency_id = fields.Many2one("res.currency", string="Currency", ondelete="set null")
