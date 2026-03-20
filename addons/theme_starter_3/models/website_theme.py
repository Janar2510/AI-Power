"""Theme starter extension for theme_starter_3 (phase 358-359)."""

from core.orm import Model, fields


class WebsiteTheme(Model):
    _inherit = "website.theme"

    starter_3_enabled = fields.Boolean(string="Starter 3 Enabled", default=True)
