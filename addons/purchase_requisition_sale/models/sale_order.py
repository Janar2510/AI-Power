"""Extend sale.order with purchase requisition link."""

from core.orm import Model, fields


class SaleOrderRequisition(Model):
    _inherit = "sale.order"

    requisition_id = fields.Many2one("purchase.requisition", string="Purchase Agreement", copy=False)
