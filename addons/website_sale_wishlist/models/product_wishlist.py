"""Wishlist model for website sale (phase 316)."""

from core.orm import Model, fields


class ProductWishlist(Model):
    _name = "product.wishlist"
    _description = "Product Wishlist"

    partner_id = fields.Many2one("res.partner", string="Partner", ondelete="cascade")
    product_id = fields.Many2one("product.product", string="Product", ondelete="cascade")
    website_id = fields.Many2one("website", string="Website", ondelete="set null")
