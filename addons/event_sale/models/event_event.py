"""Event aggregate sale line counters."""

from core.orm import Model, api, fields


class EventEventSale(Model):
    _inherit = "event.event"

    sale_order_line_ids = fields.One2many(
        "sale.order.line",
        "event_id",
        string="Sales Order Lines",
        copy=False,
    )
    sale_count = fields.Integer(
        string="Sale Count",
        compute="_compute_sale_count",
    )

    @api.depends("sale_order_line_ids")
    def _compute_sale_count(self):
        for event in self:
            event.sale_count = len(event.sale_order_line_ids) if event.sale_order_line_ids else 0
