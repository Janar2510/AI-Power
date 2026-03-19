"""POS event sale line bridge field (phase 339)."""

from core.orm import Model, fields


class PosOrderLine(Model):
    _inherit = "pos.order.line"

    event_ticket_id = fields.Many2one("event.ticket", string="Event Ticket", ondelete="set null")
