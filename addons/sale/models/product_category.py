"""Product category for shop filtering (Phase 141)."""

from core.orm import Model, fields


class ProductCategory(Model):
    _name = "product.category"
    _description = "Product Category"

    name = fields.Char(required=True)
    parent_id = fields.Many2one("product.category", string="Parent")
