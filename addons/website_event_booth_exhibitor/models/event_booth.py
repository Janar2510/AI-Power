"""Event booth exhibitor bridge (phase 324)."""

from core.orm import Model, fields


class EventBooth(Model):
    _inherit = "event.booth"

    exhibitor_id = fields.Many2one("event.exhibitor", string="Exhibitor", ondelete="set null")
