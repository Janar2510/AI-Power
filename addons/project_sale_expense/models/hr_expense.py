"""Sale expense project bridge methods."""

from core.orm import Model


class HrExpenseProjectSaleExpense(Model):
    _inherit = "hr.expense"

    def _compute_analytic_distribution(self):
        return None

    def action_post(self):
        try:
            return super().action_post()
        except AttributeError:
            return True
