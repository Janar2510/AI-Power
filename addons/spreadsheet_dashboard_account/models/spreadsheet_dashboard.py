"""Spreadsheet account dashboard fields (phase 348)."""

from core.orm import Model, fields


class SpreadsheetDashboard(Model):
    _inherit = "spreadsheet.dashboard"

    account_dashboard_enabled = fields.Boolean(string="Account Dashboard Enabled", default=True)
