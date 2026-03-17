"""Analytic line - cost/revenue distribution (Phase 168)."""

from core.orm import Model, fields


class AnalyticLine(Model):
    _name = "analytic.line"
    _description = "Analytic Line"

    name = fields.Char(string="Description", required=True)
    date = fields.Date(string="Date", required=True)
    account_id = fields.Many2one("analytic.account", string="Analytic Account", required=True)
    amount = fields.Float(string="Amount", default=0.0)
    unit_amount = fields.Float(string="Quantity", default=0.0)
    partner_id = fields.Many2one("res.partner", string="Partner")
    move_line_id = fields.Many2one("account.move.line", string="Journal Item")
