"""Minimal product model for sale orders (Phase 112)."""

from core.orm import Model, fields


class ProductProduct(Model):
    _name = "product.product"
    _description = "Product"

    name = fields.Char(required=True)
    list_price = fields.Float(string="Sales Price", default=0.0)
    categ_id = fields.Many2one("product.category", string="Category")
