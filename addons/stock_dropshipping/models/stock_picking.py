"""Dropship picking flag (Phase 305)."""

from core.orm import Model, fields


class StockPicking(Model):
    _inherit = "stock.picking"

    is_dropship = fields.Boolean(string="Dropship", default=False)
