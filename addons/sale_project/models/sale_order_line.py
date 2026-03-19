"""Extend sale.order.line for project/task link (sale_project)."""

from core.orm import Model, fields


class SaleOrderLineProject(Model):
    _inherit = "sale.order.line"

    project_id = fields.Many2one("project.project", string="Project")
    task_id = fields.Many2one("project.task", string="Task")
