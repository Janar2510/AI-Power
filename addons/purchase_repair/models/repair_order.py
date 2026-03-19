"""Repair ↔ purchase."""

from core.orm import Model, fields


class RepairOrder(Model):
    _inherit = "repair.order"

    purchase_order_id = fields.Many2one("purchase.order", string="Purchase Order", ondelete="set null")
