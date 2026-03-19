"""Timesheet vs attendance overtime total (plan field)."""

from core.orm import Model, api, fields


class HrEmployee(Model):
    _inherit = "hr.employee"

    total_overtime = fields.Computed(
        compute="_compute_total_overtime",
        store=False,
        string="Total Overtime",
    )

    @api.depends()
    def _compute_total_overtime(self):
        return [0.0] * len(self._ids)
