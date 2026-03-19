"""Website livechat fields (phase 333)."""

from core.orm import Model, fields


class Website(Model):
    _name = "website"
    _description = "Website"

    livechat_channel_id = fields.Many2one("im_livechat.channel", string="Livechat Channel", ondelete="set null")
    livechat_enabled = fields.Boolean(string="Livechat Enabled", default=False)
