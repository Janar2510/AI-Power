"""Live quiz interactions for tracks (phase 323)."""

from core.orm import Model, fields


class EventTrackLiveQuiz(Model):
    _name = "event.track.live.quiz"
    _description = "Event Track Live Quiz"

    track_id = fields.Many2one("event.track", string="Track", ondelete="cascade")
    quiz_id = fields.Many2one("event.quiz", string="Quiz", ondelete="cascade")
