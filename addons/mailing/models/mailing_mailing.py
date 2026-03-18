"""mailing.mailing - Mass mailing campaign (Phase 207)."""

import re
import secrets
from typing import Optional

from jinja2 import Template
from jinja2.exceptions import TemplateError

from core.orm import Model, fields


class MailingMailing(Model):
    _name = "mailing.mailing"
    _description = "Mass Mailing"

    name = fields.Char(string="Name", required=True)
    subject = fields.Char(string="Subject", required=True)
    body_html = fields.Text(string="Body", help="Jinja2 HTML template; {{ object }} has partner fields")
    mailing_list_id = fields.Many2one("mailing.list", string="Mailing List", required=True, ondelete="cascade")
    state = fields.Selection(
        selection=[("draft", "Draft"), ("sending", "Sending"), ("sent", "Sent")],
        default="draft",
        string="Status",
    )
    sent_count = fields.Integer(string="Sent", default=0)
    opened_count = fields.Integer(string="Opened", default=0)
    clicked_count = fields.Integer(string="Clicked", default=0)

    def _render_body(self, body: str, record_dict: dict) -> str:
        """Render Jinja2 body with object=record_dict."""
        if not body or not isinstance(body, str):
            return "<p></p>"
        try:
            t = Template(body)
            return t.render(object=record_dict, **record_dict)
        except TemplateError:
            return body

    def _add_tracking_pixel(self, body: str, token: str, base_url: str) -> str:
        """Append 1x1 tracking pixel."""
        pixel_url = f"{base_url}/mail/track/open/{token}"
        return body + f'<img src="{pixel_url}" width="1" height="1" alt="" style="display:none"/>'

    def _rewrite_links(self, body: str, token: str, base_url: str) -> str:
        """Rewrite href to point to click tracker."""
        def repl(m):
            url = m.group(1)
            if url.startswith("mailto:") or url.startswith("#"):
                return m.group(0)
            from urllib.parse import quote
            encoded = quote(url, safe="")
            return f'href="{base_url}/mail/track/click/{token}?url={encoded}"'
        return re.sub(r'href=["\']([^"\']+)["\']', repl, body, flags=re.IGNORECASE)

    def _get_base_url(self) -> str:
        """Base URL for tracking links."""
        try:
            from core.tools.config import get_config
            cfg = get_config()
            url = getattr(cfg, "url", None) or "http://localhost:8069"
            return url.rstrip("/")
        except Exception:
            return "http://localhost:8069"

    def action_send(self) -> bool:
        """Queue mail.mail for each subscriber. Returns True if queued."""
        env = getattr(self, "env", None)
        if not env:
            return False
        MailingListPartner = env.get("mailing.list.partner")
        MailingTracking = env.get("mailing.tracking")
        MailMail = env.get("mail.mail")
        Partner = env.get("res.partner")
        if not all([MailingListPartner, MailingTracking, MailMail, Partner]):
            return False
        self.write({"state": "sending"})
        base_url = self._get_base_url()
        row = self.read(["mailing_list_id", "subject", "body_html"])
        if not row:
            self.write({"state": "draft"})
            return False
        list_id = row[0].get("mailing_list_id")
        if isinstance(list_id, (list, tuple)) and list_id:
            list_id = list_id[0]
        if not list_id:
            self.write({"state": "draft"})
            return False
        subs = MailingListPartner.search([
            ("mailing_list_id", "=", list_id),
            ("is_subscribed", "=", True),
        ])
        if not subs:
            self.write({"state": "draft"})
            return False
        partner_ids = []
        sub_rows = subs.read(["partner_id"])
        for r in sub_rows:
            pid = r.get("partner_id")
            if isinstance(pid, (list, tuple)) and pid:
                pid = pid[0]
            if pid:
                partner_ids.append(pid)
        partners = Partner.browse(partner_ids).read(["id", "name", "email"])
        sent = 0
        subject_tpl = row[0].get("subject") or "(No subject)"
        body_tpl = row[0].get("body_html") or "<p></p>"
        mid = self.ids[0] if self.ids else (getattr(self, "id", None) or 0)
        for p in partners:
            email = p.get("email") or ""
            if not email or not email.strip():
                continue
            token = secrets.token_urlsafe(32)
            MailingTracking.create({
                "mailing_id": mid,
                "partner_id": p.get("id"),
                "token": token,
            })
            record_dict = dict(p)
            record_dict["email"] = email
            body = self._render_body(body_tpl, record_dict)
            body = self._add_tracking_pixel(body, token, base_url)
            body = self._rewrite_links(body, token, base_url)
            subject = subject_tpl
            try:
                t = Template(str(subject_tpl))
                subject = t.render(object=record_dict, **record_dict)
            except TemplateError:
                pass
            MailMail.create({
                "email_from": "noreply@localhost",
                "email_to": email.strip(),
                "subject": subject,
                "body_html": body,
                "state": "outgoing",
                "res_model": "mailing.mailing",
                "res_id": mid,
            })
            sent += 1
        self.write({"state": "sent", "sent_count": sent})
        return sent > 0

    @classmethod
    def track_open(cls, env, token: str) -> Optional[int]:
        """Mark email as opened. Returns mailing_id if updated."""
        if not env:
            return None
        MailingTracking = env.get("mailing.tracking")
        if not MailingTracking:
            return None
        recs = MailingTracking.search([("token", "=", token)], limit=1)
        if not recs or not recs.ids:
            return None
        rec = recs.browse(recs.ids[0])
        row = rec.read(["opened", "mailing_id"])
        if not row or row[0].get("opened"):
            return row[0].get("mailing_id") if row else None
        rec.write({"opened": True})
        mid = row[0].get("mailing_id")
        if isinstance(mid, (list, tuple)) and mid:
            mid = mid[0]
        if mid:
            Mailing = env.get("mailing.mailing")
            if Mailing:
                mrow = Mailing.browse(mid).read(["opened_count"])
                if mrow:
                    cur = mrow[0].get("opened_count") or 0
                    Mailing.browse(mid).write({"opened_count": cur + 1})
        return mid

    @classmethod
    def track_click(cls, env, token: str, url: Optional[str] = None) -> Optional[str]:
        """Mark email as clicked. Returns redirect URL (or url param)."""
        if not env:
            return url or "/"
        MailingTracking = env.get("mailing.tracking")
        if not MailingTracking:
            return url or "/"
        recs = MailingTracking.search([("token", "=", token)], limit=1)
        if not recs or not recs.ids:
            return url or "/"
        rec = recs.browse(recs.ids[0])
        row = rec.read(["clicked", "mailing_id"])
        if not row:
            return url or "/"
        mid = row[0].get("mailing_id")
        if isinstance(mid, (list, tuple)) and mid:
            mid = mid[0]
        if not row[0].get("clicked"):
            rec.write({"clicked": True})
            if mid:
                Mailing = env.get("mailing.mailing")
                if Mailing:
                    mrow = Mailing.browse(mid).read(["clicked_count"])
                    if mrow:
                        cur = mrow[0].get("clicked_count") or 0
                        Mailing.browse(mid).write({"clicked_count": cur + 1})
        from urllib.parse import unquote
        return unquote(url) if url else "/"

    @classmethod
    def unsubscribe(cls, env, token: str) -> Optional[bool]:
        """Unsubscribe partner from list. Returns True if updated."""
        if not env:
            return None
        MailingTracking = env.get("mailing.tracking")
        MailingListPartner = env.get("mailing.list.partner")
        if not MailingTracking or not MailingListPartner:
            return None
        recs = MailingTracking.search([("token", "=", token)], limit=1)
        if not recs or not recs.ids:
            return None
        row = recs.browse(recs.ids[0]).read(["mailing_id", "partner_id"])
        if not row:
            return None
        mid = row[0].get("mailing_id")
        pid = row[0].get("partner_id")
        if isinstance(mid, (list, tuple)) and mid:
            mid = mid[0]
        if isinstance(pid, (list, tuple)) and pid:
            pid = pid[0]
        if not mid or not pid:
            return None
        mrow = cls.browse(mid).read(["mailing_list_id"])
        if not mrow:
            return None
        list_id = mrow[0].get("mailing_list_id")
        if isinstance(list_id, (list, tuple)) and list_id:
            list_id = list_id[0]
        if not list_id:
            return None
        subs = MailingListPartner.search([
            ("mailing_list_id", "=", list_id),
            ("partner_id", "=", pid),
        ], limit=1)
        if subs and subs.ids:
            MailingListPartner.browse(subs.ids[0]).write({"is_subscribed": False})
            return True
        return None
