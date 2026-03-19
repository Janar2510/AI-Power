"""Hierarchy view registration hooks (phase 306)."""

from core.orm import Model, fields


class IrUiView(Model):
    _inherit = "ir.ui.view"

    hierarchy_view_enabled = fields.Boolean(string="Hierarchy View Enabled", default=True)
    web_hierarchy_parent_field = fields.Char(
        string="Hierarchy Parent Field",
        default="parent_id",
    )

    def get_supported_view_types(self):
        return ["hierarchy"]
