"""Link Tracker - shorten and track URLs with UTM."""

from core.orm import Model, fields


class LinkTracker(Model):
    """Link trackers wrap URLs into short tracked links with UTM."""

    _name = "link.tracker"
    _description = "Link Tracker"
    _rec_name = "short_url"
    _order = "id desc"

    url = fields.Char(string="Target URL", required=True)
    campaign_id = fields.Many2one("utm.campaign", string="Campaign")
    source_id = fields.Many2one("utm.source", string="Source")
    medium_id = fields.Many2one("utm.medium", string="Medium")
    short_url = fields.Char(string="Tracked URL")
    title = fields.Char(string="Page Title")
    label = fields.Char(string="Button label")
    link_code_ids = fields.One2many(
        "link.tracker.code",
        "link_id",
        string="Codes",
    )
    link_click_ids = fields.One2many(
        "link.tracker.click",
        "link_id",
        string="Clicks",
    )
    count = fields.Integer(string="Number of Clicks", default=0)
