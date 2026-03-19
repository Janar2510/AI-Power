"""Project profitability hooks for sale expenses."""

from core.orm import Model


class ProjectProjectSaleExpense(Model):
    _inherit = "project.project"

    def _get_expenses_profitability_items(self, with_action=True):
        del with_action
        return {
            "costs": {
                "id": "expenses",
                "sequence": 13,
                "billed": 0.0,
                "to_bill": 0.0,
            }
        }

    def _get_already_included_profitability_invoice_line_ids(self):
        try:
            return super()._get_already_included_profitability_invoice_line_ids()
        except AttributeError:
            return []
