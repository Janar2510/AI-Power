"""lunch.cashmove. Phase 260."""

from core.orm import Model, fields


class LunchCashmove(Model):
    _name = "lunch.cashmove"
    _description = "Lunch Cash Move"

    user_id = fields.Many2one("res.users", required=True)
    amount = fields.Float(required=True)
    date = fields.Date(required=True)
    description = fields.Char()
