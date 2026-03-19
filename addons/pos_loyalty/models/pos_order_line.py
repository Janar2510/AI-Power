"""POS loyalty reward fields on order lines (phase 337)."""

from core.orm import Model, fields


class PosOrderLine(Model):
    _inherit = "pos.order.line"

    reward_id = fields.Many2one("loyalty.reward", string="Reward", ondelete="set null")
