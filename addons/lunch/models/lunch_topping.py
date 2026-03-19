"""lunch.topping. Phase 260."""

from core.orm import Model, fields


class LunchTopping(Model):
    _name = "lunch.topping"
    _description = "Lunch Topping"

    name = fields.Char(required=True)
    price = fields.Float(default=0)
    category_id = fields.Many2one("lunch.product.category")
