"""Theme starter extension for theme_starter_2 (phase 358-359)."""

from core.orm import Model, fields


class WebsiteTheme(Model):
    _inherit = "website.theme"

    starter_2_enabled = fields.Boolean(string="Starter 2 Enabled", default=True)
