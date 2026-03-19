"""UTM Campaign - marketing campaign."""

from core.orm import Model, fields


class UtmCampaign(Model):
    _name = "utm.campaign"
    _description = "UTM Campaign"
    _rec_name = "title"

    active = fields.Boolean(default=True)
    name = fields.Char(string="Campaign Identifier", required=True)
    title = fields.Char(string="Campaign Name", required=True)
    user_id = fields.Many2one(
        "res.users",
        string="Responsible",
    )
    stage_id = fields.Many2one(
        "utm.stage",
        string="Stage",
        ondelete="restrict",
    )
    tag_ids = fields.Many2many(
        "utm.tag",
        "utm_tag_rel",
        "tag_id",
        "campaign_id",
        string="Tags",
    )
    is_auto_campaign = fields.Boolean(
        default=False,
        string="Automatically Generated Campaign",
    )
    color = fields.Integer(string="Color Index")
