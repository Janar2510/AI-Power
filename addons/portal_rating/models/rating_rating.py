"""rating.rating portal extension. Phase 259."""

from core.orm import Model, fields


class RatingRatingPortal(Model):
    _inherit = "rating.rating"

    # Portal display fields - minimal extension for MVP
    website_published = fields.Boolean(string="Published on Website", default=True)
