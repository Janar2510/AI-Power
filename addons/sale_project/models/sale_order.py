"""Extend sale.order with project_id."""

from core.orm import Model, fields


class SaleOrderProject(Model):
    _inherit = "sale.order"

    project_id = fields.Many2one("project.project", string="Project")
