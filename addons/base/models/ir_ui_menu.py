"""ir.ui.menu - Menu item (Odoo 19 parity, persistent)."""

from core.orm import Model, fields


class IrUiMenu(Model):
    _name = "ir.ui.menu"
    _description = "Menu"

    xml_id = fields.Char(string="XML ID")
    name = fields.Char(required=True)
    action_ref = fields.Char(string="Action")  # xml_id of ir.actions.act_window
    parent_ref = fields.Char(string="Parent")  # xml_id of parent menu
    sequence = fields.Integer(default=10)
    groups_ref = fields.Char(string="Groups")  # comma-separated xml_ids; empty = visible to all
    web_icon = fields.Char(string="Web Icon")  # "module,icon_path" or "fa-icon,color,bg"
    web_icon_data = fields.Char(string="Web Icon Data")  # base64 data URI for custom icon
    active = fields.Boolean(default=True)
