"""Company website outgoing links (Phase 306)."""

from core.orm import Model, fields


class ResCompany(Model):
    _inherit = "res.company"

    website_links_track_outgoing = fields.Boolean(string="Track Outgoing Website Links", default=False)
