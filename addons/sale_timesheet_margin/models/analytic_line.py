"""Extend timesheet lines with sale margin information."""

from core.orm import Model, api, fields


class AnalyticLineSaleMargin(Model):
    _inherit = "analytic.line"

    margin = fields.Float(
        string="Margin",
        compute="_compute_margin",
        store=True,
    )

    @api.depends("so_line_id", "unit_amount")
    def _compute_margin(self):
        for line in self:
            if not getattr(line, "so_line_id", None):
                line.margin = 0.0
                continue
            sale_line = line.so_line_id
            qty = line.read(["unit_amount"])[0].get("unit_amount") or 0.0
            cost = sale_line.read(["purchase_price"])[0].get("purchase_price") or 0.0
            line.margin = 0.0 - (qty * cost)
