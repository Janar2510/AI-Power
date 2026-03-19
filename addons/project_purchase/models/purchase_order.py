"""Purchase order project link."""

from core.orm import Model, fields


class PurchaseOrderProject(Model):
    _inherit = "purchase.order"

    project_id = fields.Many2one("project.project", string="Project")
