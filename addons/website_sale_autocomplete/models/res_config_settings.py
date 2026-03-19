"""Website sale autocomplete setting (phase 325)."""

from core.orm import Model, fields


class ResConfigSettings(Model):
    _inherit = "res.config.settings"

    website_sale_autocomplete_enabled = fields.Boolean(
        string="Website Sale Autocomplete Enabled",
        default=False,
    )
