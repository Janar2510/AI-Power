"""Project landed cost count bridge (phase 315)."""

from core.orm import Model, api, fields


class ProjectProject(Model):
    _inherit = "project.project"

    mrp_landed_cost_count = fields.Computed(
        compute="_compute_mrp_landed_cost_count",
        string="MRP Landed Cost Count",
        store=False,
    )

    @api.depends()
    def _compute_mrp_landed_cost_count(self):
        return [0] * len(self._ids)
