"""lunch.order. Phase 260."""

from core.orm import Model, fields


class LunchOrder(Model):
    _name = "lunch.order"
    _description = "Lunch Order"

    user_id = fields.Many2one("res.users", required=True)
    product_id = fields.Many2one("lunch.product", required=True)
    topping_ids = fields.Many2many("lunch.topping", string="Toppings")
    date = fields.Date(required=True)
    price = fields.Float(default=0)
    state = fields.Selection(selection=[("draft", "Draft"), ("confirmed", "Confirmed")], default="draft")
    note = fields.Text()
