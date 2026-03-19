"""Spreadsheet collaborative session model (phase 347)."""

from core.orm import Model, fields


class SpreadsheetCollaborativeSession(Model):
    _name = "spreadsheet.collaborative.session"
    _description = "Spreadsheet Collaborative Session"

    user_id = fields.Many2one("res.users", string="User", ondelete="cascade")
    mixin_id = fields.Many2one("spreadsheet.mixin", string="Mixin", ondelete="cascade")
    last_seen = fields.Datetime(string="Last Seen")
