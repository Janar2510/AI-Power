"""Spreadsheet mixin model (phase 347)."""

from core.orm import Model, fields


class SpreadsheetMixin(Model):
    _name = "spreadsheet.mixin"
    _description = "Spreadsheet Mixin"

    spreadsheet_data = fields.Text(string="Spreadsheet Data")
    spreadsheet_revision_ids = fields.One2many("spreadsheet.revision", "mixin_id", string="Revisions")
