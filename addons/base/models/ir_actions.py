"""ir.actions.act_window - Window action (Odoo 19 parity, persistent)."""

from core.orm import Model, fields


class IrActionsActWindow(Model):
    _name = "ir.actions.act_window"
    _description = "Window Action"

    xml_id = fields.Char(string="XML ID")
    name = fields.Char(required=True)
    res_model = fields.Char(string="Model")
    view_mode = fields.Char(string="View Mode", default="list,form")
    context = fields.Text(string="Context")  # JSON string for action context
    domain = fields.Text(string="Domain")    # JSON/domain string for default list filter
