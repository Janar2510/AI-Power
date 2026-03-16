"""Project model."""

from core.orm import Model, fields


class ProjectProject(Model):
    _name = "project.project"
    _description = "Project"

    name = fields.Char(required=True)
    description = fields.Text()
    partner_id = fields.Many2one("res.partner", string="Customer")
