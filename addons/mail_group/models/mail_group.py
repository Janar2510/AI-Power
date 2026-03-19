"""Mail group model (phase 313)."""

from core.orm import Model, fields


class MailGroup(Model):
    _name = "mail.group"
    _description = "Mail Group"

    name = fields.Char(string="Name", required=True)
    alias_id = fields.Many2one("mail.alias", string="Alias", ondelete="set null")
    description = fields.Text(string="Description", default="")
    moderation = fields.Boolean(string="Moderation", default=False)
