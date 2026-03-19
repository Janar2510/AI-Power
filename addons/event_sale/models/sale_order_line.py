"""Sale order lines linked to events and tickets."""

from core.orm import Model, fields


class SaleOrderLineEvent(Model):
    _inherit = "sale.order.line"

    event_id = fields.Many2one("event.event", string="Event", copy=False)
    event_ticket_id = fields.Many2one("event.event.ticket", string="Event Ticket", copy=False)
