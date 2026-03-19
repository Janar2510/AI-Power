"""UTM source mass mailing helper field (phase 330)."""

from core.orm import Model, fields


class UtmSource(Model):
    _inherit = "utm.source"

    mailing_source_enabled = fields.Boolean(string="Mailing Source Enabled", default=True)
