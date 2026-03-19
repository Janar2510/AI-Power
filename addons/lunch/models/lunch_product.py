"""lunch.product. Phase 260."""

from core.orm import Model, fields


class LunchProduct(Model):
    _name = "lunch.product"
    _description = "Lunch Product"

    name = fields.Char(required=True)
    category_id = fields.Many2one("lunch.product.category")
    supplier_id = fields.Many2one("lunch.supplier")
    price = fields.Float(default=0)
    active = fields.Boolean(default=True)
    description = fields.Text()
