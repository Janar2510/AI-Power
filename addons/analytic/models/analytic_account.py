"""Analytic account - cost center (Phase 248, extracted from account)."""

from core.orm import Model, fields


class AnalyticAccount(Model):
    _name = "analytic.account"
    _description = "Analytic Account"

    name = fields.Char(string="Name", required=True)
    code = fields.Char(string="Code")
    plan_id = fields.Many2one("account.analytic.plan", string="Analytic Plan")
    partner_id = fields.Many2one("res.partner", string="Partner")
    company_id = fields.Many2one("res.company", string="Company")
    active = fields.Boolean(string="Active", default=True)
