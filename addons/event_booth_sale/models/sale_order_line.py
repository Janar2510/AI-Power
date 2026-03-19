"""Booth linkage on sale lines (phase 314)."""

from core.orm import Model, fields


class SaleOrderLine(Model):
    _inherit = "sale.order.line"

    event_booth_id = fields.Many2one("event.booth", string="Event Booth", ondelete="set null")
