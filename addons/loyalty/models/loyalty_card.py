"""loyalty.card (Phase 241)."""

from core.orm import Model, fields


class LoyaltyCard(Model):
    _name = "loyalty.card"
    _description = "Loyalty Card"

    name = fields.Char(required=True, string="Card")
    program_id = fields.Many2one("loyalty.program", string="Program")
    partner_id = fields.Many2one("res.partner", string="Partner")
    points = fields.Float(string="Points", default=0)
