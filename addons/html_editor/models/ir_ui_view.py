"""HTML editor toggle on views (phase 309)."""

from core.orm import Model, fields


class IrUiView(Model):
    _inherit = "ir.ui.view"

    html_editor_enabled = fields.Boolean(string="HTML Editor Enabled", default=True)
