"""Fetchmail server - IMAP fetch and process incoming emails (Phase 130)."""

import email
import imaplib
import logging
from typing import Any, Dict, List, Optional

from core.orm import Model, fields

_logger = logging.getLogger("erp.fetchmail")


class FetchmailServer(Model):
    _name = "fetchmail.server"
    _description = "Inbound Mail Server"

    name = fields.Char(required=True, string="Name")
    server = fields.Char(required=True, string="Server")
    port = fields.Integer(default=993, string="Port")
    user = fields.Char(string="Username")
    password = fields.Char(string="Password")
    server_type = fields.Selection(
        selection=[("imap", "IMAP")],
        string="Type",
        default="imap",
    )
    active = fields.Boolean(default=True)

    @classmethod
    def run_fetchmail(cls) -> int:
        """Cron entrypoint: run fetch_mail on all active servers. Returns total processed."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            return 0
        total = 0
        recs = cls.search([("active", "=", True)])
        for rec in recs:
            total += rec.fetch_mail(env)
        return total

    def fetch_mail(self, env: Any) -> int:
        """Connect via IMAP, fetch unseen emails, process via message_process. Returns count processed."""
        if self.server_type != "imap":
            return 0
        count = 0
        try:
            if self.port == 993:
                conn = imaplib.IMAP4_SSL(self.server, self.port)
            else:
                conn = imaplib.IMAP4(self.server, self.port)
            conn.login(self.user or "", self.password or "")
            conn.select("INBOX", readonly=False)
            typ, data = conn.search(None, "UNSEEN")
            if typ != "OK" or not data or not data[0]:
                conn.logout()
                return 0
            for num in data[0].split():
                try:
                    typ, msg_data = conn.fetch(num, "(RFC822)")
                    if typ != "OK" or not msg_data:
                        continue
                    raw = msg_data[0][1] if isinstance(msg_data[0], tuple) else msg_data[0]
                    msg = email.message_from_bytes(raw)
                    if self._message_process(env, msg):
                        count += 1
                        conn.store(num, "+FLAGS", "\\Seen")
                except Exception as e:
                    _logger.warning("Fetchmail process message error: %s", e)
            conn.logout()
        except Exception as e:
            _logger.warning("Fetchmail IMAP error: %s", e)
        return count

    def _message_process(self, env: Any, msg: email.message.Message) -> bool:
        """Process one email: find alias, create record or post to chatter."""
        to_addrs = self._get_to_addrs(msg)
        subject = self._get_header(msg, "Subject") or "(No Subject)"
        body = self._get_body(msg)
        from_addr = self._get_header(msg, "From") or ""

        for addr in to_addrs:
            Alias = env.get("mail.alias")
            if not Alias:
                continue
            recs = Alias.search([("alias_name", "=", addr)], limit=1)
            if not recs:
                continue
            row = recs.read(["alias_model", "alias_force"])[0]
            model_name = row.get("alias_model")
            if not model_name:
                continue
            ModelCls = env.get(model_name)
            if not ModelCls:
                continue
            if model_name == "crm.lead":
                ModelCls.create({
                    "name": subject[:200],
                    "description": body or "",
                })
                return True
        return False

    def _get_to_addrs(self, msg: email.message.Message) -> List[str]:
        to = self._get_header(msg, "To") or ""
        addrs = []
        for part in to.split(","):
            part = part.strip()
            if "<" in part and ">" in part:
                start = part.index("<") + 1
                end = part.index(">")
                addrs.append(part[start:end].strip().lower())
            elif "@" in part:
                addrs.append(part.lower())
        return addrs

    def _get_header(self, msg: email.message.Message, name: str) -> Optional[str]:
        val = msg.get(name)
        if not val:
            return None
        if isinstance(val, (list, tuple)):
            val = val[0] if val else None
        if hasattr(val, "decode"):
            from email.header import decode_header
            decoded = decode_header(val)
            parts = []
            for b, enc in decoded:
                if isinstance(b, bytes):
                    parts.append(b.decode(enc or "utf-8", errors="replace"))
                else:
                    parts.append(str(b))
            return "".join(parts)
        return str(val)

    def _get_body(self, msg: email.message.Message) -> str:
        if msg.is_multipart():
            for part in msg.walk():
                ctype = part.get_content_type()
                if ctype == "text/plain":
                    payload = part.get_payload(decode=True)
                    if payload:
                        return payload.decode("utf-8", errors="replace")
                elif ctype == "text/html":
                    payload = part.get_payload(decode=True)
                    if payload:
                        return payload.decode("utf-8", errors="replace")
            return ""
        payload = msg.get_payload(decode=True)
        if payload:
            return payload.decode("utf-8", errors="replace")
        return ""
