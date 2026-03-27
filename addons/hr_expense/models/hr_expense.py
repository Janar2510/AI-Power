"""Expense line (Phase 161)."""

from core.orm import Model, api, fields


class HrExpense(Model):
    _name = "hr.expense"
    _description = "Expense"

    name = fields.Char(required=True)
    employee_id = fields.Many2one("hr.employee", string="Employee", required=True)
    product_id = fields.Many2one("product.product", string="Product")
    unit_amount = fields.Float(string="Unit Price", default=0.0)
    quantity = fields.Float(default=1.0)
    total_amount = fields.Computed(compute="_compute_total_amount", string="Total")
    date = fields.Date(default=lambda: __import__("datetime").datetime.utcnow().strftime("%Y-%m-%d"))
    analytic_account_id = fields.Many2one("analytic.account", string="Analytic Account")
    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("reported", "Reported"),
            ("approved", "Approved"),
            ("done", "Done"),
            ("refused", "Refused"),
        ],
        default="draft",
    )
    sheet_id = fields.Many2one("hr.expense.sheet", string="Expense Sheet", ondelete="set null")

    @classmethod
    def _create_hr_expense_record(cls, vals):
        """ORM insert hook for `_inherit` merge-safe overrides (checklist)."""
        return super().create(vals)

    @classmethod
    def create(cls, vals):
        return cls._create_hr_expense_record(vals)

    @api.depends("unit_amount", "quantity")
    def _compute_total_amount(self):
        if not self:
            return []
        rows = self.read(["unit_amount", "quantity"])
        return [r.get("unit_amount", 0) * r.get("quantity", 1) for r in rows]
