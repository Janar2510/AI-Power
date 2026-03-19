"""Extend hr.expense with computed margin from sale order."""

from core.orm import Model, api, fields


class HrExpenseMargin(Model):
    _inherit = "hr.expense"

    margin = fields.Float(
        string="Margin",
        compute="_compute_margin",
    )

    @api.depends("sale_order_id")
    def _compute_margin(self):
        for expense in self:
            sale_order = expense.sale_order_id
            expense.margin = (sale_order.margin if sale_order else 0.0) or 0.0
