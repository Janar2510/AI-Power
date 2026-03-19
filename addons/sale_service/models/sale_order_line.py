"""Extend sale.order.line for service products."""

from core.orm import Model, fields


class SaleOrderLineService(Model):
    _inherit = "sale.order.line"

    project_id = fields.Many2one("project.project", string="Project")
    task_id = fields.Many2one("project.task", string="Task")
