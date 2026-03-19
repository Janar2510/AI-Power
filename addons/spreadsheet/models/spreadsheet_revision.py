"""Spreadsheet revision model (phase 347)."""

from core.orm import Model, fields


class SpreadsheetRevision(Model):
    _name = "spreadsheet.revision"
    _description = "Spreadsheet Revision"

    mixin_id = fields.Many2one("spreadsheet.mixin", string="Mixin", ondelete="cascade")
    commands = fields.Text(string="Commands")
    version = fields.Integer(string="Version", default=1)
