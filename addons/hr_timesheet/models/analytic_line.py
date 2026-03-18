"""Extend analytic.line with timesheet fields (Phase 192)."""

from core.orm import Model, fields


class AnalyticLine(Model):
    _inherit = "analytic.line"

    employee_id = fields.Many2one("hr.employee", string="Employee")
    task_id = fields.Many2one("project.task", string="Task")
    project_id = fields.Many2one("project.project", string="Project")
