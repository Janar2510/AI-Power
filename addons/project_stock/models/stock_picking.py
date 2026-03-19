"""Add project linkage on stock pickings."""

from core.orm import Model, fields


class StockPickingProject(Model):
    _inherit = "stock.picking"

    project_id = fields.Many2one("project.project", string="Project")
