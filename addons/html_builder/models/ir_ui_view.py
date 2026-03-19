"""HTML builder toggle on views (phase 309)."""

from core.orm import Model, fields


class IrUiView(Model):
    _inherit = "ir.ui.view"

    html_builder_enabled = fields.Boolean(string="HTML Builder Enabled", default=True)
