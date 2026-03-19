"""Project website slug (Phase 307)."""

from core.orm import Model, fields


class ProjectProject(Model):
    _inherit = "project.project"

    website_project_slug = fields.Char(string="Website Slug", default="")
