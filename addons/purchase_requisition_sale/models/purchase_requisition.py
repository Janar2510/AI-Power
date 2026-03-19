"""Extend purchase.requisition with sales order counter."""

from core.orm import Model, api, fields


class PurchaseRequisitionSale(Model):
    _inherit = "purchase.requisition"

    sale_order_count = fields.Integer(
        string="Sales Order Count",
        compute="_compute_sale_order_count",
    )

    @api.depends("name")
    def _compute_sale_order_count(self):
        SaleOrder = self.env["sale.order"]
        for requisition in self:
            requisition.sale_order_count = SaleOrder.search_count([("requisition_id", "=", requisition.id)])
