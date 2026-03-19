"""Org chart child count (Phase 307)."""

from core.orm import Model, api, fields


class HrEmployee(Model):
    _inherit = "hr.employee"

    hr_org_chart_child_count = fields.Computed(
        compute="_compute_hr_org_chart_child_count",
        store=False,
        string="Org Chart Child Count",
    )

    @api.depends()
    def _compute_hr_org_chart_child_count(self):
        return [0] * len(self._ids)
