"""lunch.product.category. Phase 260."""

from core.orm import Model, fields


class LunchProductCategory(Model):
    _name = "lunch.product.category"
    _description = "Lunch Product Category"

    name = fields.Char(required=True)
    company_id = fields.Many2one("res.company")
