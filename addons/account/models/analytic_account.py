"""Analytic account - cost center (Phase 168)."""

from core.orm import Model, fields


class AnalyticAccount(Model):
    _name = "analytic.account"
    _description = "Analytic Account"

    name = fields.Char(string="Name", required=True)
    code = fields.Char(string="Code")
    partner_id = fields.Many2one("res.partner", string="Partner")
    company_id = fields.Many2one("res.company", string="Company")
    active = fields.Boolean(string="Active", default=True)
