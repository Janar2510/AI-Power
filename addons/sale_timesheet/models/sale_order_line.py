"""Extend sale.order.line with timesheet delivery for sale_timesheet."""

from core.orm import Model, api, fields


class SaleOrderLineTimesheet(Model):
    _inherit = "sale.order.line"

    timesheet_ids = fields.One2many(
        "analytic.line",
        "so_line_id",
        string="Timesheets",
        domain=[("project_id", "!=", False)],
    )
    qty_delivered = fields.Float(
        string="Delivered",
        compute="_compute_qty_delivered",
        store=True,
    )
    qty_delivered_method = fields.Selection(
        selection=[
            ("manual", "Manual"),
            ("timesheet", "Timesheets"),
        ],
        string="Delivered Quantity",
        default="manual",
    )

    @api.depends("timesheet_ids.unit_amount")
    def _compute_qty_delivered(self):
        for line in self:
            if line.qty_delivered_method != "timesheet" or not line.timesheet_ids:
                line.qty_delivered = 0.0
                continue
            rows = line.timesheet_ids.read(["unit_amount"])
            line.qty_delivered = sum(r.get("unit_amount") or 0.0 for r in rows)
