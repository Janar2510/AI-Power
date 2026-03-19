"""Livechat core models and mail channel fields (phase 332)."""

from core.orm import Model, fields


class ImLivechatChannel(Model):
    _name = "im_livechat.channel"
    _description = "Livechat Channel"

    name = fields.Char(string="Name", default="")
    user_ids = fields.Many2many(
        "res.users",
        "im_livechat_channel_user_rel",
        "channel_id",
        "user_id",
        string="Operators",
    )
    web_page = fields.Char(string="Web Page", default="")
    button_text = fields.Char(string="Button Text", default="")
    default_message = fields.Text(string="Default Message")


class ImLivechatChannelRule(Model):
    _name = "im_livechat.channel.rule"
    _description = "Livechat Channel Rule"

    channel_id = fields.Many2one("im_livechat.channel", string="Channel", ondelete="cascade")
    regex_url = fields.Char(string="Regex URL", default="")
    action = fields.Selection(
        selection=[("display", "Display"), ("hide", "Hide"), ("auto_popup", "Auto Popup")],
        string="Action",
        default="display",
    )
    auto_popup_timer = fields.Integer(string="Auto Popup Timer", default=0)


class MailChannel(Model):
    _inherit = "mail.channel"

    livechat_channel_id = fields.Many2one("im_livechat.channel", string="Livechat Channel", ondelete="set null")
    livechat_operator_id = fields.Many2one("res.users", string="Livechat Operator", ondelete="set null")
