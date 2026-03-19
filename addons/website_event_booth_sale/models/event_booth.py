"""Website booth sale linkage (phase 315)."""

from core.orm import Model, fields


class EventBooth(Model):
    _inherit = "event.booth"

    website_event_booth_sale_order_line_id = fields.Many2one(
        "sale.order.line",
        string="Website Booth Sale Order Line",
        ondelete="set null",
    )
