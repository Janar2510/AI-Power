"""Project ↔ purchase pickings (plan: purchase_picking_count)."""

from core.orm import Model, api, fields


class ProjectProject(Model):
    _inherit = "project.project"

    purchase_picking_count = fields.Computed(
        compute="_compute_purchase_picking_count",
        store=False,
        string="Purchase Picking Count",
    )

    @api.depends()
    def _compute_purchase_picking_count(self):
        return [0] * len(self._ids)
