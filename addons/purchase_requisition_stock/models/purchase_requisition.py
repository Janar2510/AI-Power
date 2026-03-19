"""Extend purchase.requisition with transfer counter."""

from core.orm import Model, api, fields


class PurchaseRequisitionStock(Model):
    _inherit = "purchase.requisition"

    picking_count = fields.Integer(
        string="Transfer Count",
        compute="_compute_picking_count",
    )

    @api.depends("name")
    def _compute_picking_count(self):
        Picking = self.env["stock.picking"]
        for requisition in self:
            requisition.picking_count = Picking.search_count([("requisition_id", "=", requisition.id)])
