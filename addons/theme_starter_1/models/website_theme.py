"""Theme starter extension for theme_starter_1 (phase 358-359)."""

from core.orm import Model, fields


class WebsiteTheme(Model):
    _inherit = "website.theme"

    starter_1_enabled = fields.Boolean(string="Starter 1 Enabled", default=True)
