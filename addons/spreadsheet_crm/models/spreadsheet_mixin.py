"""Spreadsheet CRM fields (phase 348)."""

from core.orm import Model, fields


class SpreadsheetMixin(Model):
    _inherit = "spreadsheet.mixin"

    crm_data_sources = fields.Text(string="CRM Data Sources")
