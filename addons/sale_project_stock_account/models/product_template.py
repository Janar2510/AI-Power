"""Expense policy on products for reinvoicing rules."""

from core.orm import Model, fields


class ProductTemplate(Model):
    _inherit = "product.template"

    expense_policy = fields.Selection(
        selection=[
            ("no", "No"),
            ("cost", "At Cost"),
            ("sales_price", "Sales Price"),
        ],
        string="Re-Invoice Expenses",
        default="no",
    )
