"""Bridge account.move ↔ hr.expense.sheet (Phase 751)."""

from core.orm import Model, fields


class AccountMove(Model):
    _inherit = "account.move"

    hr_expense_sheet_id = fields.Many2one(
        "hr.expense.sheet",
        string="Expense Sheet",
        ondelete="set null",
        help="Set when this entry is created from an expense report.",
    )
