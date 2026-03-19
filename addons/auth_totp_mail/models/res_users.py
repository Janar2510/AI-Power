"""TOTP mail-template bridge (phase 304)."""

from core.orm import Model, fields


class ResUsers(Model):
    _inherit = "res.users"

    totp_invite_template_id = fields.Many2one(
        "mail.template",
        string="TOTP Invite Template",
        ondelete="set null",
    )
    totp_reminder_template_id = fields.Many2one(
        "mail.template",
        string="TOTP Reminder Template",
        ondelete="set null",
    )
    totp_mail_enabled = fields.Boolean(string="TOTP Mail Enabled", default=True)
