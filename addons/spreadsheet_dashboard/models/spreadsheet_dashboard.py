"""Spreadsheet dashboard model (phase 347)."""

from core.orm import Model, fields


class SpreadsheetDashboard(Model):
    _name = "spreadsheet.dashboard"
    _description = "Spreadsheet Dashboard"

    name = fields.Char(string="Name", default="")
    spreadsheet_data = fields.Text(string="Spreadsheet Data")
    group_ids = fields.Many2many(
        "res.groups",
        "spreadsheet_dashboard_res_groups_rel",
        "dashboard_id",
        "group_id",
        string="Groups",
    )
    dashboard_group_id = fields.Many2one("spreadsheet.dashboard.group", string="Dashboard Group", ondelete="set null")
