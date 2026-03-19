"""Extend stock.picking with purchase requisition link."""

from core.orm import Model, fields


class StockPickingRequisition(Model):
    _inherit = "stock.picking"

    requisition_id = fields.Many2one("purchase.requisition", string="Purchase Agreement", copy=False)
