"""mail.channel - Discuss channels for real-time messaging (Phase 147)."""

from datetime import datetime

from core.orm import Model, fields


class MailChannel(Model):
    _name = "mail.channel"
    _description = "Discuss Channel"

    name = fields.Char(string="Name", required=True)
    channel_type = fields.Selection(
        selection=[
            ("chat", "Direct Message"),
            ("channel", "Channel"),
            ("group", "Group"),
        ],
        string="Type",
        default="channel",
    )
    description = fields.Text(string="Description")
    message_ids = fields.One2many(
        "mail.message",
        "res_id",
        domain=lambda m: [("res_model", "=", "mail.channel")],
        inverse_extra=lambda m: {"res_model": "mail.channel"},
        string="Messages",
    )
    channel_member_ids = fields.One2many(
        "mail.channel.member",
        "channel_id",
        string="Members",
    )

    def message_post(self, body: str = "", message_type: str = "comment", **kwargs):
        """Post message and notify channel via bus."""
        env = getattr(self, "env", None)
        if not env:
            return self.env.get("mail.message").browse([])
        MailMessage = env.get("mail.message")
        if not MailMessage:
            return MailMessage.browse([])
        rid = self.ids[0] if self.ids else self.id
        uid = env.uid if hasattr(env, "uid") else None
        vals = {
            "res_model": "mail.channel",
            "res_id": rid,
            "body": body or "",
            "message_type": message_type or "comment",
            "date": datetime.utcnow().isoformat(),
            "author_id": uid,
        }
        msg = MailMessage.create(vals)
        try:
            BusBus = env.get("bus.bus")
            if BusBus:
                payload = {
                    "type": "message",
                    "res_model": "mail.channel",
                    "res_id": rid,
                    "message_id": msg.ids[0] if msg.ids else msg.id,
                    "body": body,
                    "author_id": uid,
                }
                BusBus.sendone(f"mail.channel_{rid}", payload)
                for m in self.channel_member_ids:
                    uid_val = m.read(["user_id"])[0].get("user_id") if m.ids else None
                    if uid_val:
                        uid_val = uid_val[0] if isinstance(uid_val, (list, tuple)) else uid_val
                        BusBus.sendone(f"res.partner_{uid_val}", payload)
        except Exception:
            pass
        try:
            MailNotification = env.get("mail.notification")
            User = env.get("res.users")
            if MailNotification and User:
                for m in self.channel_member_ids:
                    r = m.read(["user_id"])[0] if m.ids else {}
                    uid_val = r.get("user_id")
                    if not uid_val:
                        continue
                    uid_val = uid_val[0] if isinstance(uid_val, (list, tuple)) else uid_val
                    if uid_val == uid:
                        continue
                    user_row = User.read_ids([uid_val], ["partner_id"])
                    if not user_row or not user_row[0].get("partner_id"):
                        continue
                    pid = user_row[0]["partner_id"]
                    pid = pid[0] if isinstance(pid, (list, tuple)) else pid
                    if pid:
                        MailNotification.create({
                            "res_partner_id": pid,
                            "mail_message_id": msg.ids[0] if msg.ids else msg.id,
                            "is_read": False,
                            "notification_type": "inbox",
                        })
        except Exception:
            pass
        return msg
