"""Account move line sale determination bridge."""

from core.orm import Model, fields


class AccountMoveLineProjectSaleExpense(Model):
    _inherit = "account.move.line"

    expense_id = fields.Many2one("hr.expense", string="Expense")

    def _sale_determine_order(self):
        return {}
