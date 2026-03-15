"""mail.mail - Outbound email queue (Phase 91)."""

from typing import Any, Dict, List, Type, TypeVar

from core.orm import Model, fields

T = TypeVar("T", bound="Model")


class MailMail(Model):
    _name = "mail.mail"
    _description = "Outgoing Email"

    email_from = fields.Char(string="From")
    email_to = fields.Char(string="To")
    subject = fields.Char(string="Subject")
    body_html = fields.Text(string="Body")
    state = fields.Selection(
        selection=[
            ("outgoing", "Outgoing"),
            ("sent", "Sent"),
            ("exception", "Exception"),
            ("cancel", "Cancelled"),
        ],
        default="outgoing",
        string="Status",
    )
    failure_reason = fields.Text(string="Failure Reason")
    res_model = fields.Char(string="Related Model")
    res_id = fields.Integer(string="Related Record ID")

    def send(self, auto_commit: bool = False) -> bool:
        """Send this email via ir.mail_server. Updates state on success/failure."""
        if self.state != "outgoing":
            return False
        env = getattr(self, "env", None)
        if not env:
            return False
        MailServer = env.get("ir.mail_server")
        if not MailServer:
            self.write({"state": "exception", "failure_reason": "ir.mail_server not found"})
            return False
        servers = MailServer.search([], order="sequence")
        if not servers.ids:
            self.write({"state": "exception", "failure_reason": "No mail server configured"})
            return False
        server = MailServer.browse(servers.ids[0])
        try:
            ok = server.send_email(self)
            if ok:
                self.write({"state": "sent"})
                return True
            self.write({"state": "exception", "failure_reason": "Send returned False"})
        except Exception as e:
            self.write({"state": "exception", "failure_reason": str(e)})
        return False

    @classmethod
    def process_email_queue(cls) -> Dict[str, int]:
        """Process outgoing mail.mail records. Called by cron. Returns {sent: N, failed: N}."""
        registry = getattr(cls, "_registry", None)
        env = getattr(registry, "_env", None) if registry else None
        if not env:
            return {"sent": 0, "failed": 0}
        outgoing = cls.search([("state", "=", "outgoing")], limit=50)
        sent = 0
        failed = 0
        for rec in outgoing:
            if rec.send():
                sent += 1
            else:
                failed += 1
        return {"sent": sent, "failed": failed}
