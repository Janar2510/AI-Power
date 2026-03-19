"""Analytic plan - plan hierarchy (Phase 248, Odoo 16+ parity)."""

from core.orm import Model, fields


class AnalyticPlan(Model):
    _name = "account.analytic.plan"
    _description = "Analytic Plan"

    name = fields.Char(string="Name", required=True)
    parent_id = fields.Many2one("account.analytic.plan", string="Parent Plan")
    color = fields.Integer(string="Color")
