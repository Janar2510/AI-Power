"""Marketing card model (phase 318)."""

from core.orm import Model, fields


class MarketingCard(Model):
    _name = "marketing.card"
    _description = "Marketing Card"

    name = fields.Char(string="Name", required=True)
    template = fields.Text(string="Template", default="")
    campaign_id = fields.Char(string="Campaign", default="")
    share_url = fields.Char(string="Share URL", default="")
