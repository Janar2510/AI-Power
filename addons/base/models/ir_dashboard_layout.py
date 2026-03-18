"""Phase 223: User dashboard layout (customizable widgets)."""

from core.orm import Model, fields


class IrDashboardLayout(Model):
    _name = "ir.dashboard.layout"
    _description = "Dashboard Layout"

    user_id = fields.Many2one("res.users", string="User", required=True)
    layout_json = fields.Text(string="Layout JSON", default="{}")
