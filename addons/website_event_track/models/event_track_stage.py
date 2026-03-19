"""Event track stage model (phase 323)."""

from core.orm import Model, fields


class EventTrackStage(Model):
    _name = "event.track.stage"
    _description = "Event Track Stage"

    name = fields.Char(string="Name", default="")
    sequence = fields.Integer(string="Sequence", default=10)
    is_done = fields.Boolean(string="Done", default=False)
