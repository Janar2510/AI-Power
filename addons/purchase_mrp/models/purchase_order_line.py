"""Extend purchase.order.line with BOM links."""

from core.orm import Model, fields


class PurchaseOrderLineMrp(Model):
    _inherit = "purchase.order.line"

    bom_line_id = fields.Many2one("mrp.bom.line", string="BOM Line", copy=False)
    bom_id = fields.Many2one("mrp.bom", string="BOM", copy=False)
