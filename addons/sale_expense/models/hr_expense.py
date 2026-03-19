"""Extend hr.expense with sale_order_id for sale_expense."""

from core.orm import Model, fields


class HrExpenseSale(Model):
    _inherit = "hr.expense"

    sale_order_id = fields.Many2one(
        "sale.order",
        string="Customer to Reinvoice",
        copy=False,
        help="Expense can be reinvoiced on this sales order.",
    )
