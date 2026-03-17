"""MailThreadMixin - add message_ids and message_post to any model (Phase 81)."""

import uuid
from datetime import datetime
from typing import Any, Dict

from core.orm import fields


class MailThreadMixin:
    """Python mixin: add message_ids and message_post to any model via inheritance.
    Use: class CrmLead(MailThreadMixin, Model): ...
    """

    message_ids = fields.One2many(
        "mail.message",
        "res_id",
        domain=lambda m: [("res_model", "=", m._name)],
        inverse_extra=lambda m: {"res_model": m._name},
        string="Messages",
    )

    def message_post(
        self,
        body: str = "",
        message_type: str = "comment",
        send_as_email: bool = False,
        attachment_ids: list = None,
    ) -> "MailMessage":
        """Post a message on this record. When send_as_email=True and record has email, create mail.mail."""
        env = getattr(self, "env", None)
        if not env:
            raise RuntimeError("message_post requires env")
        MailMessage = env.get("mail.message")
        if not MailMessage:
            raise RuntimeError("mail.message model not found")
        rid = self.id if hasattr(self, "id") else (self.ids[0] if hasattr(self, "ids") and self.ids else None)
        if not rid:
            raise ValueError("message_post requires a saved record")
        uid = env.uid if hasattr(env, "uid") else None
        message_id_val = f"<{uuid.uuid4().hex}@erp>"  # Phase 172: for In-Reply-To routing
        vals: Dict[str, Any] = {
            "res_model": self._model._name,
            "res_id": rid,
            "body": body or "",
            "message_type": message_type or "comment",
            "date": datetime.utcnow().isoformat(),
            "message_id": message_id_val,
        }
        if uid:
            vals["author_id"] = uid
        msg = MailMessage.create(vals)
        if attachment_ids:
            Attachment = env.get("ir.attachment")
            if Attachment:
                for aid in attachment_ids:
                    if aid:
                        Attachment.browse([aid]).write({"mail_message_id": msg.ids[0] if msg.ids else msg.id})
        try:
            BusBus = env.get("bus.bus")
            if BusBus:
                payload = {"type": "message", "res_model": self._model._name, "res_id": rid}
                BusBus.sendone(f"mail.message_{self._model._name}_{rid}", payload)
                if uid:
                    BusBus.sendone(f"res.partner_{uid}", payload)
        except Exception:
            pass
        try:
            MailNotification = env.get("mail.notification")
            if MailNotification:
                Partner = env.get("res.partner")
                User = env.get("res.users")
                rows = self.read(["partner_id"])
                if rows and rows[0].get("partner_id"):
                    pid = rows[0]["partner_id"]
                    pid = pid[0] if isinstance(pid, (list, tuple)) else pid
                    if not pid:
                        pass
                    else:
                        author_partner = None
                        if uid and User:
                            urows = User.read_ids([uid], ["partner_id"])
                            if urows and urows[0].get("partner_id"):
                                author_partner = urows[0]["partner_id"]
                                author_partner = author_partner[0] if isinstance(author_partner, (list, tuple)) else author_partner
                        if pid != author_partner:
                            partner = Partner.browse([pid])
                            if partner and partner.read(["user_id"]) and partner.read(["user_id"])[0].get("user_id"):
                                MailNotification.create({
                                    "res_partner_id": pid,
                                    "mail_message_id": msg.ids[0] if msg.ids else msg.id,
                                    "is_read": False,
                                    "notification_type": "inbox",
                                })
        except Exception:
            pass
        if send_as_email:
            email_to = self._get_email_to_for_post()
            if email_to:
                MailMail = env.get("mail.mail")
                if MailMail:
                    email_from = self._get_email_from_for_post(env, uid)
                    MailMail.create({
                        "email_from": email_from,
                        "email_to": email_to,
                        "subject": f"Re: {self._model._name}#{rid}",
                        "body_html": f"<p>{body or ''}</p>",
                        "state": "outgoing",
                        "res_model": self._model._name,
                        "res_id": rid,
                        "message_id": message_id_val,  # Phase 172: for In-Reply-To routing
                    })
        return msg

    def _get_email_to_for_post(self) -> str:
        """Get recipient email from record (email field or partner_id.email)."""
        rows = self.read(["email", "partner_id"])
        if not rows:
            return ""
        r = rows[0]
        email = r.get("email")
        if email:
            return str(email).strip()
        partner_id = r.get("partner_id")
        if partner_id:
            Partner = self.env.get("res.partner") if hasattr(self, "env") else None
            if Partner:
                pr = Partner.read_ids([partner_id], ["email"])
                if pr and pr[0].get("email"):
                    return str(pr[0]["email"]).strip()
        return ""

    def _get_email_from_for_post(self, env: Any, uid: int) -> str:
        """Get sender email (user email or default)."""
        User = env.get("res.users")
        if User:
            rows = User.read_ids([uid], ["email"])
            if rows and rows[0].get("email"):
                return str(rows[0]["email"]).strip()
        return "noreply@localhost"
