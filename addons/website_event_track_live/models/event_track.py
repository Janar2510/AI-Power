"""Live event track fields (phase 323)."""

from core.orm import Model, fields


class EventTrack(Model):
    _inherit = "event.track"

    is_live = fields.Boolean(string="Is Live", default=False)
    youtube_video_url = fields.Char(string="YouTube Video URL", default="")
