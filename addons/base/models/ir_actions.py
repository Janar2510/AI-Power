"""Persistent action models (Odoo 19 parity)."""

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


class IrActionsActUrl(Model):
    _name = "ir.actions.act_url"
    _description = "URL Action"

    xml_id = fields.Char(string="XML ID")
    name = fields.Char(required=True)
    url = fields.Char(string="URL")
    target = fields.Char(string="Target", default="self")


class IrActionsReport(Model):
    _name = "ir.actions.report"
    _description = "Report Action"

    xml_id = fields.Char(string="XML ID")
    name = fields.Char(required=True)
    model = fields.Char(required=True, string="Model")
    report_name = fields.Char(required=True, string="Report Name")
    report_file = fields.Char(required=True, string="Template Path")
    report_type = fields.Char(string="Report Type", default="qweb-html")
    fields_csv = fields.Text(string="Fields CSV")
