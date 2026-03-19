"""Spreadsheet account fields (phase 347)."""

from core.orm import Model, fields


class SpreadsheetMixin(Model):
    _inherit = "spreadsheet.mixin"

    account_data_sources = fields.Text(string="Account Data Sources")
