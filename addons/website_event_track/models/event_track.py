"""Event track models (phase 323)."""

from core.orm import Model, fields


class EventTrack(Model):
    _name = "event.track"
    _description = "Event Track"

    name = fields.Char(string="Name", default="")
    event_id = fields.Many2one("event.event", string="Event", ondelete="cascade")
    speaker_ids = fields.Many2many(
        "res.partner",
        "event_track_speaker_rel",
        "track_id",
        "partner_id",
        string="Speakers",
    )
    date = fields.Datetime(string="Date")
    duration = fields.Float(string="Duration")
    stage_id = fields.Many2one("event.track.stage", string="Stage", ondelete="set null")
    website_published = fields.Boolean(string="Website Published", default=False)
