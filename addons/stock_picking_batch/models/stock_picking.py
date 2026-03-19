"""Picking ↔ batch."""

from core.orm import Model, fields


class StockPicking(Model):
    _inherit = "stock.picking"

    batch_id = fields.Many2one("stock.picking.batch", string="Batch", ondelete="set null")
