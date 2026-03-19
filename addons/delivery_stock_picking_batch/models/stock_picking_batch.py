"""Carrier field on stock picking batch (phase 311)."""

from core.orm import Model, fields


class StockPickingBatch(Model):
    _inherit = "stock.picking.batch"

    carrier_id = fields.Many2one("delivery.carrier", string="Carrier", ondelete="set null")
