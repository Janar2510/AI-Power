"""POS event linkage field (phase 339)."""

from core.orm import Model, fields


class PosOrder(Model):
    _inherit = "pos.order"

    event_id = fields.Many2one("event.event", string="Event", ondelete="set null")
