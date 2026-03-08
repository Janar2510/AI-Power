"""mail.message and MailThreadMixin - threaded message history (Phase 81)."""

from datetime import datetime
from typing import Any, Dict, Type, TypeVar

from core.orm import Model, fields

T = TypeVar("T", bound="Model")


class MailMessage(Model):
    _name = "mail.message"
    _description = "Message"

    body = fields.Text(string="Body")
    author_id = fields.Many2one("res.users", string="Author")
    res_model = fields.Char(string="Related Model")
    res_id = fields.Integer(string="Related Record ID")
    date = fields.Datetime(string="Date")
    message_type = fields.Selection(
        selection=[("comment", "Comment"), ("note", "Note")],
        default="comment",
        string="Type",
    )


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

    def message_post(self, body: str = "", message_type: str = "comment") -> "MailMessage":
        """Post a message on this record."""
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
        vals: Dict[str, Any] = {
            "res_model": self._model._name,
            "res_id": rid,
            "body": body or "",
            "message_type": message_type or "comment",
            "date": datetime.utcnow().isoformat(),
        }
        if uid:
            vals["author_id"] = uid
        return MailMessage.create(vals)
