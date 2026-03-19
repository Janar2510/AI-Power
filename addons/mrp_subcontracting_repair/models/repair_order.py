"""Subcontracting move on repair (plan field)."""

from core.orm import Model, fields


class RepairOrder(Model):
    _inherit = "repair.order"

    subcontract_move_id = fields.Many2one(
        "stock.move",
        string="Subcontracting Move",
        ondelete="set null",
    )
