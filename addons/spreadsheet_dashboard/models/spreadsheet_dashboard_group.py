"""Spreadsheet dashboard group model (phase 347)."""

from core.orm import Model, fields


class SpreadsheetDashboardGroup(Model):
    _name = "spreadsheet.dashboard.group"
    _description = "Spreadsheet Dashboard Group"

    name = fields.Char(string="Name", default="")
    sequence = fields.Integer(string="Sequence", default=10)
