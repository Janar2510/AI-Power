"""BOM project link (Odoo project_mrp parity)."""

from core.orm import Model, fields


class MrpBom(Model):
    _inherit = "mrp.bom"

    project_id = fields.Many2one("project.project", string="Project", ondelete="set null")
