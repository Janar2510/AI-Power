"""Spreadsheet CRM dashboard fields (phase 348)."""

from core.orm import Model, fields


class SpreadsheetDashboard(Model):
    _inherit = "spreadsheet.dashboard"

    crm_dashboard_enabled = fields.Boolean(string="CRM Dashboard Enabled", default=True)
