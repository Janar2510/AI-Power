"""Extend stock.move with is_subcontract (Phase 253)."""

from core.orm import Model, fields


class StockMove(Model):
    _inherit = "stock.move"

    is_subcontract = fields.Boolean(string="Is Subcontracting", default=False)
