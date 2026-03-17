"""ir.mail_server - SMTP server configuration (Phase 91)."""

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Any, Optional

from core.orm import Model, fields


class IrMailServer(Model):
    _name = "ir.mail_server"
    _description = "Outgoing Mail Server"

    name = fields.Char(required=True, string="Description")
    smtp_host = fields.Char(required=True, string="SMTP Server")
    smtp_port = fields.Integer(default=25, string="SMTP Port")
    smtp_user = fields.Char(string="Username")
    smtp_pass = fields.Char(string="Password")
    smtp_encryption = fields.Selection(
        selection=[
            ("none", "None"),
            ("starttls", "TLS (STARTTLS)"),
            ("ssl", "SSL/TLS"),
        ],
        default="none",
        string="Connection Security",
    )
    smtp_debug = fields.Boolean(default=False, string="Debug")
    sequence = fields.Integer(default=10, string="Priority")

    def connect(self) -> Any:
        """Return smtplib.SMTP or SMTP_SSL connection."""
        rows = self.read(["smtp_encryption", "smtp_host", "smtp_port", "smtp_user", "smtp_pass"])
        enc = rows[0] if rows else {}
        host = enc.get("smtp_host") or ""
        port = enc.get("smtp_port") or 25
        user = enc.get("smtp_user")
        password = enc.get("smtp_pass")
        encryption = enc.get("smtp_encryption") or "none"
        if encryption == "ssl":
            context = ssl.create_default_context()
            conn = smtplib.SMTP_SSL(host, port, context=context)
        else:
            conn = smtplib.SMTP(host, port)
            if encryption == "starttls":
                context = ssl.create_default_context()
                conn.starttls(context=context)
        if user and password:
            conn.login(user, password)
        return conn

    def send_email(self, message: "MailMail") -> bool:
        """Send mail.mail record via SMTP."""
        rows = message.read(["email_from", "email_to", "subject", "body_html", "message_id"])
        if not rows:
            return False
        r = rows[0]
        email_from = r.get("email_from") or ""
        email_to = r.get("email_to") or ""
        subject = r.get("subject") or "(No Subject)"
        body_html = r.get("body_html") or ""
        message_id = r.get("message_id")
        if not email_from or not email_to:
            return False
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = email_from
        msg["To"] = email_to
        if message_id:
            msg["Message-ID"] = message_id
        msg.attach(MIMEText(body_html or "(empty)", "html"))
        conn = self.connect()
        try:
            conn.sendmail(email_from, [t.strip() for t in email_to.split(",") if t.strip()], msg.as_string())
        finally:
            conn.quit()
        return True

    def test_smtp_connection(self) -> dict:
        """Test SMTP connection. Returns {success: bool, message: str}. Call on server recordset."""
        if not self.ids:
            return {"success": False, "message": "Server not found"}
        try:
            conn = self.connect()
            conn.quit()
            return {"success": True, "message": "Connection successful"}
        except Exception as e:
            return {"success": False, "message": str(e)}
