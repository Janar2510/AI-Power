"""Event booth model (phase 314)."""

from core.orm import Model, fields


class EventBooth(Model):
    _name = "event.booth"
    _description = "Event Booth"

    name = fields.Char(string="Name", required=True)
    event_id = fields.Many2one("event.event", string="Event", ondelete="cascade")
    booth_category_id = fields.Many2one("event.booth.category", string="Category", ondelete="set null")
    state = fields.Selection(
        selection=[("available", "Available"), ("reserved", "Reserved")],
        string="State",
        default="available",
    )
    partner_id = fields.Many2one("res.partner", string="Partner", ondelete="set null")
