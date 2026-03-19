"""Project to-do bridge on project.task."""

from core.orm import Model, api


class ProjectTaskTodo(Model):
    _inherit = "project.task"

    @api.model_create_multi
    def create(self, vals_list):
        prepared = []
        for vals in vals_list:
            vals = dict(vals or {})
            if not vals.get("name"):
                vals["name"] = "Untitled to-do"
            prepared.append(vals)
        return super().create(prepared)

    def action_convert_to_task(self):
        self.ensure_one()
        return {
            "type": "ir.actions.act_window",
            "res_model": "project.task",
            "res_id": self.id,
            "view_mode": "form",
        }

    @api.model
    def get_todo_views_id(self):
        return []
