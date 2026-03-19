"""Event ticket model bridge for products."""

from core.orm import Model, fields


class EventEventTicket(Model):
    _name = "event.event.ticket"
    _description = "Event Ticket"

    name = fields.Char(string="Ticket Name", required=True)
    event_id = fields.Many2one("event.event", string="Event", required=True)
    product_id = fields.Many2one("product.product", string="Product", required=True)
    price = fields.Float(string="Price", default=0.0)
    seats_max = fields.Integer(string="Maximum Seats", default=0)
    seats_available = fields.Integer(string="Available Seats", default=0)
    seats_reserved = fields.Integer(string="Reserved Seats", default=0)
