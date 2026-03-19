"""Project landed cost count (plan field)."""

from core.orm import Model, api, fields


class ProjectProject(Model):
    _inherit = "project.project"

    landed_cost_count = fields.Computed(
        compute="_compute_landed_cost_count",
        store=False,
        string="Landed Cost Count",
    )

    @api.depends()
    def _compute_landed_cost_count(self):
        return [0] * len(self._ids)
