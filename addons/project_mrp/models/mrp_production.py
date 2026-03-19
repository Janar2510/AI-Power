"""MO project from BOM (Odoo project_mrp parity)."""

from core.orm import Model, fields


class MrpProduction(Model):
    _inherit = "mrp.production"

    project_id = fields.Many2one("project.project", string="Project", ondelete="set null")

    def action_open_project(self):
        return {"type": "ir.actions.act_window", "res_model": "project.project"}
