"""Minimal loyalty.rule model used by sale_loyalty bridge."""

from core.orm import Model, fields


class LoyaltyRule(Model):
    _name = "loyalty.rule"
    _description = "Loyalty Rule"

    name = fields.Char(required=True, string="Rule")
    program_id = fields.Many2one("loyalty.program", string="Program")
    active = fields.Boolean(default=True)
