"""Wishlist collect bridge field (phase 326)."""

from core.orm import Model, fields


class ProductWishlist(Model):
    _inherit = "product.wishlist"

    collect_available = fields.Boolean(string="Collect Available", default=False)
