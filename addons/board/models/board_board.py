"""Board dashboard model (phase 309)."""

from core.orm import Model, fields


class BoardBoard(Model):
    _name = "board.board"
    _description = "Board"

    name = fields.Char(string="Name", required=True)
    view_id = fields.Many2one("ir.ui.view", string="View", ondelete="set null")
