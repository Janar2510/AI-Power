"""Back-link to sale lines for event booths (phase 314)."""

from core.orm import Model, fields


class EventBooth(Model):
    _inherit = "event.booth"

    sale_order_line_ids = fields.One2many("sale.order.line", "event_booth_id", string="Sale Order Lines")
