"""loyalty.program (Phase 241)."""

from core.orm import Model, fields


class LoyaltyProgram(Model):
    _name = "loyalty.program"
    _description = "Loyalty Program"

    name = fields.Char(required=True, string="Program")
    active = fields.Boolean(default=True)
