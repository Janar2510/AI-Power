"""Extend analytic.line with so_line for sale_timesheet."""

from core.orm import Model, fields


class AnalyticLineSale(Model):
    _inherit = "analytic.line"

    so_line_id = fields.Many2one(
        "sale.order.line",
        string="Sale Order Line",
        copy=False,
    )
