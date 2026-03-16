"""mail.notification - In-app notifications for message_post (Phase 148)."""

from core.orm import Model, fields


class MailNotification(Model):
    _name = "mail.notification"
    _description = "Notification"

    res_partner_id = fields.Many2one("res.partner", string="Recipient", required=True, ondelete="cascade")
    mail_message_id = fields.Many2one("mail.message", string="Message", required=True, ondelete="cascade")
    is_read = fields.Boolean(string="Read", default=False)
    notification_type = fields.Selection(
        selection=[
            ("inbox", "Inbox"),
            ("email", "Email"),
        ],
        string="Type",
        default="inbox",
    )
