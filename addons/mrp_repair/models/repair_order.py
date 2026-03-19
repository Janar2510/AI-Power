"""Repair order ↔ BoM (plan fields)."""

from core.orm import Model, fields


class RepairOrder(Model):
    _inherit = "repair.order"

    bom_id = fields.Many2one("mrp.bom", string="Bill of Materials", ondelete="set null")
