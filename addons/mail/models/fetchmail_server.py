"""fetchmail.server - incoming mail gateway configuration (Phase 406)."""

from core.orm import Model, fields


class FetchmailServer(Model):
    _name = "fetchmail.server"
    _description = "Fetchmail Server"

    name = fields.Char(required=True)
    host = fields.Char(required=True)
    port = fields.Integer(default=993)
    protocol = fields.Selection(
        selection=[("imap", "IMAP"), ("pop", "POP")],
        default="imap",
    )
    username = fields.Char(required=True)
    password = fields.Char()
    is_ssl = fields.Boolean(default=True)
    active = fields.Boolean(default=True)

    def fetch_mail(self):
        """Gateway hook for incoming mail synchronization."""
        return True
