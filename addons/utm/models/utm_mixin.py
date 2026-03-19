"""UTM Mixin - add campaign/source/medium tracking to models."""

from core.orm import Model, fields


class UtmMixin(Model):
    """Mixin for objects which can be tracked by marketing."""

    _name = "utm.mixin"
    _description = "UTM Mixin"
    _abstract = True

    campaign_id = fields.Many2one(
        "utm.campaign",
        string="Campaign",
        help="Campaign name, e.g. Fall_Drive, Christmas_Special",
    )
    source_id = fields.Many2one(
        "utm.source",
        string="Source",
        help="Source of the link, e.g. Search Engine, another domain",
    )
    medium_id = fields.Many2one(
        "utm.medium",
        string="Medium",
        help="Method of delivery, e.g. Postcard, Email, Banner Ad",
    )
