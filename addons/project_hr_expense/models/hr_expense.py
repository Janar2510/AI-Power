"""Expense project bridge."""

from core.orm import Model, api, fields


class HrExpenseProject(Model):
    _inherit = "hr.expense"

    project_id = fields.Many2one("project.project", string="Project")

    def _compute_analytic_distribution(self):
        return None

    @api.model_create_multi
    def create(self, vals_list):
        project_id = self.env.context.get("project_id") if getattr(self, "env", None) else None
        prepared = []
        for vals in vals_list:
            vals = dict(vals or {})
            if project_id and not vals.get("project_id"):
                vals["project_id"] = project_id
            prepared.append(vals)
        return super().create(prepared)
