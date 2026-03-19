"""Extend project.task with sale_line_id."""

from core.orm import Model, fields


class ProjectTaskSale(Model):
    _inherit = "project.task"

    sale_line_id = fields.Many2one("sale.order.line", string="Sale Order Line")
