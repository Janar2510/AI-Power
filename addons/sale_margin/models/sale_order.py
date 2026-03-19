"""Extend sale.order with margin for sale_margin."""

from core.orm import Model, api, fields


class SaleOrderMargin(Model):
    _inherit = "sale.order"

    margin = fields.Float(
        string="Margin",
        compute="_compute_margin",
        store=True,
    )
    margin_percent = fields.Float(
        string="Margin (%)",
        compute="_compute_margin",
        store=True,
    )

    @api.depends("order_line.margin", "amount_total")
    def _compute_margin(self):
        for order in self:
            if not order.order_line:
                order.margin = 0.0
                order.margin_percent = 0.0
                continue
            rows = order.order_line.read(["margin"])
            order.margin = sum(r.get("margin") or 0.0 for r in rows)
            total = order.read(["amount_total"])[0].get("amount_total") or 0.0
            order.margin_percent = total and (order.margin / total) or 0.0
