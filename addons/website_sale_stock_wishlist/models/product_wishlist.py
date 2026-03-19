"""Wishlist stock bridge fields (phase 325)."""

from core.orm import Model, api, fields


class ProductWishlist(Model):
    _inherit = "product.wishlist"

    qty_available = fields.Computed(
        compute="_compute_qty_available",
        string="Qty Available",
        store=False,
    )

    @api.depends()
    def _compute_qty_available(self):
        return [0.0] * len(self._ids)
