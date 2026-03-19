"""Link Tracker Click - record of each click."""

from datetime import datetime, timezone

from core.orm import Model, fields


class LinkTrackerClick(Model):
    _name = "link.tracker.click"
    _description = "Link Tracker Click"

    link_id = fields.Many2one("link.tracker", string="Link", required=True, ondelete="cascade")
    click_date = fields.Datetime(default=lambda self: datetime.now(timezone.utc).isoformat())
    ip = fields.Char(string="Internet Protocol")
    country_id = fields.Many2one("res.country", string="Country")
