"""Extend purchase.order with requisition_id."""

from core.orm import Model, fields


class PurchaseOrderRequisition(Model):
    _inherit = "purchase.order"

    requisition_id = fields.Many2one("purchase.requisition", string="Purchase Agreement", copy=False)
