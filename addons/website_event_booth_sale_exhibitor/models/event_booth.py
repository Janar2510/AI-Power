"""Booth sale exhibitor helper fields (phase 324)."""

from core.orm import Model, fields


class EventBooth(Model):
    _inherit = "event.booth"

    booth_sale_exhibitor_enabled = fields.Boolean(
        string="Booth Sale Exhibitor Enabled",
        default=True,
    )
