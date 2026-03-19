"""Comparison/wishlist bridge toggle (phase 316)."""

from core.orm import Model, fields


class ProductTemplate(Model):
    _inherit = "product.template"

    comparison_wishlist_sync_enabled = fields.Boolean(
        string="Comparison Wishlist Sync Enabled",
        default=True,
    )
