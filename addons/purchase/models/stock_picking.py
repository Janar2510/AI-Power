"""Extend stock.picking with purchase order link (Phase 197)."""

from core.orm import Model, fields


class StockPicking(Model):
    _inherit = "stock.picking"

    purchase_id = fields.Many2one("purchase.order", string="Purchase Order")
