"""Extend project.task with timesheet_ids (Phase 192)."""

from core.orm import Model, fields


class ProjectTask(Model):
    _inherit = "project.task"

    timesheet_ids = fields.One2many(
        "analytic.line",
        "task_id",
        string="Timesheets",
    )
