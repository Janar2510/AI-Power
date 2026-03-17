"""mail.message - threaded message history (Phase 81)."""

from core.orm import Model, fields


class MailMessage(Model):
    _name = "mail.message"
    _description = "Message"

    body = fields.Text(string="Body")
    message_id = fields.Char(string="Message-ID")  # Phase 172: email Message-ID for reply routing
    author_id = fields.Many2one("res.users", string="Author")
    company_id = fields.Many2one("res.company", string="Company")
    res_model = fields.Char(string="Related Model")
    res_id = fields.Integer(string="Related Record ID")
    date = fields.Datetime(string="Date")
    message_type = fields.Selection(
        selection=[("comment", "Comment"), ("note", "Note")],
        default="comment",
        string="Type",
    )
