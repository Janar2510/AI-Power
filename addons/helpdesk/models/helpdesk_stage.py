"""Helpdesk stage (Phase 190)."""

from core.orm import Model, fields


class HelpdeskStage(Model):
    _name = "helpdesk.stage"
    _description = "Helpdesk Stage"

    name = fields.Char(required=True)
    sequence = fields.Integer(default=10)
    fold = fields.Boolean(default=False)
