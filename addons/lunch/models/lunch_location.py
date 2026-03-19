"""lunch.location. Phase 260."""

from core.orm import Model, fields


class LunchLocation(Model):
    _name = "lunch.location"
    _description = "Lunch Location"

    name = fields.Char(required=True)
    company_id = fields.Many2one("res.company")
