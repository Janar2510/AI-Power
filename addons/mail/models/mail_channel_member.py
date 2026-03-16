"""mail.channel.member - Channel membership (Phase 147)."""

from core.orm import Model, fields


class MailChannelMember(Model):
    _name = "mail.channel.member"
    _description = "Channel Member"

    channel_id = fields.Many2one("mail.channel", string="Channel", required=True, ondelete="cascade")
    user_id = fields.Many2one("res.users", string="User", required=True, ondelete="cascade")
    last_seen_message_id = fields.Many2one("mail.message", string="Last Seen Message")
    is_pinned = fields.Boolean(string="Pinned", default=False)
