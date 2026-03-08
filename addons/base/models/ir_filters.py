"""ir.filters - Saved filters (Phase 80)."""

from core.orm import Model, fields


class IrFilters(Model):
    _name = "ir.filters"
    _description = "Saved Filter"

    name = fields.Char(required=True, string="Filter Name")
    model_id = fields.Char(required=True, string="Model")
    domain = fields.Text(string="Domain")
    context = fields.Text(string="Context")
    user_id = fields.Many2one("res.users", string="User")
    is_default = fields.Boolean(default=False, string="Default")
