"""ir.ui.view - View definitions (Odoo 19 parity, persistent)."""

from core.orm import Model, fields


class IrUiView(Model):
    _name = "ir.ui.view"
    _description = "View"

    xml_id = fields.Char(string="XML ID")
    name = fields.Char(string="Name")
    model = fields.Char(string="Model", required=True)
    type = fields.Char(string="Type", default="list")  # list, form, kanban
    arch = fields.Text(string="Architecture")  # JSON-serialized arch dict
    priority = fields.Integer(string="Priority", default=16)
