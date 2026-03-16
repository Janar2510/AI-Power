"""Extend stock.move with production_id for MRP."""

from core.orm import Model, fields


class StockMove(Model):
    _inherit = "stock.move"

    production_id = fields.Many2one("mrp.production", string="Manufacturing Order", ondelete="set null")
