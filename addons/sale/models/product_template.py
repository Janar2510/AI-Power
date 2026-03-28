"""Sale-specific fields on product.template (Phase 750, Odoo-style _inherit)."""

from core.orm import Model, fields


class ProductTemplate(Model):
    _inherit = "product.template"

    sale_ok = fields.Boolean(string="Can be Sold", default=True)
    invoice_policy = fields.Selection(
        selection=[("order", "Ordered quantities"), ("delivery", "Delivered quantities")],
        string="Invoicing Policy",
        default="order",
    )
    service_type = fields.Selection(
        selection=[("manual", "Manually set quantities on orders"), ("timesheet", "Timesheets on project tasks")],
        string="Track Service",
        default="manual",
    )
    expense_policy = fields.Selection(
        selection=[
            ("no", "No"),
            ("cost", "At cost"),
            ("sales_price", "Sales price"),
        ],
        string="Re-Invoice Expenses",
        default="no",
    )
