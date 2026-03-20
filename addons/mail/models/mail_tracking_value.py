"""mail.tracking.value — persisted field diff lines for tracking messages (Phase 3b)."""

from core.orm import Model, fields


class MailTrackingValue(Model):
    _name = "mail.tracking.value"
    _description = "Tracking value"
    _table = "mail_tracking_value"

    mail_message_id = fields.Many2one("mail.message", required=True, string="Message", ondelete="cascade")
    field_name = fields.Char(required=True, string="Field")
    old_value_char = fields.Text(string="Old value")
    new_value_char = fields.Text(string="New value")
