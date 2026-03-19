"""Project expense counters and action."""

from core.orm import Model, api, fields


class ProjectProjectHrExpense(Model):
    _inherit = "project.project"

    expense_count = fields.Integer(string="Expenses", compute="_compute_expense_count")

    @api.depends("name")
    def _compute_expense_count(self):
        Expense = self.env.get("hr.expense") if getattr(self, "env", None) else None
        for project in self:
            if not Expense:
                project.expense_count = 0
                continue
            project.expense_count = Expense.search_count([("project_id", "=", project.id)])

    def action_open_project_expenses(self):
        self.ensure_one()
        return {
            "type": "ir.actions.act_window",
            "name": "Expenses",
            "res_model": "hr.expense",
            "view_mode": "list,form",
            "domain": [("project_id", "=", self.id)],
            "context": {"default_project_id": self.id},
        }
