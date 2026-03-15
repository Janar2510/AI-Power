"""Sale order (Phase 112)."""

from core.orm import Model, api, fields


class SaleOrder(Model):
    _name = "sale.order"
    _description = "Sales Order"

    name = fields.Char(string="Order Reference", required=True, default="New")
    partner_id = fields.Many2one("res.partner", string="Customer", required=True)
    date_order = fields.Datetime(string="Order Date", default=lambda self: self._default_date_order())
    state = fields.Selection(
        selection=[
            ("draft", "Quotation"),
            ("sale", "Sales Order"),
            ("cancel", "Cancelled"),
        ],
        string="Status",
        default="draft",
    )
    currency_id = fields.Many2one("res.currency", string="Currency")
    amount_total = fields.Computed(compute="_compute_amount_total", string="Total")
    order_line = fields.One2many(
        "sale.order.line",
        "order_id",
        string="Order Lines",
    )

    def _default_date_order(self):
        from datetime import datetime
        return datetime.utcnow().isoformat()

    @api.depends("order_line.product_uom_qty", "order_line.price_unit")
    def _compute_amount_total(self):
        if not self:
            return []
        result = []
        for rec in self:
            lines = rec.order_line
            if not lines:
                result.append(0.0)
                continue
            rows = lines.read(["price_subtotal"])
            total = sum(r.get("price_subtotal", 0) for r in rows)
            result.append(total)
        return result

    def action_confirm(self):
        """Confirm the order (draft -> sale)."""
        self.write({"state": "sale"})

    def action_cancel(self):
        """Cancel the order."""
        self.write({"state": "cancel"})
