"""Basic mail bot model (phase 303)."""

from core.orm import Model, fields


class MailBot(Model):
    _name = "mail.bot"
    _description = "Mail Bot"

    name = fields.Char(string="Name", required=True)
    active = fields.Boolean(string="Active", default=True)
    bot_user_id = fields.Many2one("res.users", string="Bot User", ondelete="set null")

    def send_welcome_message(self):
        return True
