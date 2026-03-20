"""Theme starter extension for theme_starter_4 (phase 358-359)."""

from core.orm import Model, fields


class WebsiteTheme(Model):
    _inherit = "website.theme"

    starter_4_enabled = fields.Boolean(string="Starter 4 Enabled", default=True)
