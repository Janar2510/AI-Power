"""Task timesheet website visibility (Phase 307)."""

from core.orm import Model, fields


class ProjectTask(Model):
    _inherit = "project.task"

    website_timesheet_visible = fields.Boolean(string="Website Timesheet Visible", default=False)
