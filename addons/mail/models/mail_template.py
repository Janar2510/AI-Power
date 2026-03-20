"""mail.template - Jinja2 email templates (Phase 178)."""

from typing import Any, Dict, Optional

from jinja2 import Template
from jinja2.exceptions import TemplateError

from core.orm import Model, fields


class MailTemplate(Model):
    _name = "mail.template"
    _description = "Email Template"

    name = fields.Char(string="Name", required=True)
    model_id = fields.Char(string="Model", required=True, help="Technical model name, e.g. crm.lead")
    subject = fields.Char(string="Subject", help="Jinja2 template, e.g. Re: {{ object.name }}")
    body_html = fields.Text(string="Body", help="Jinja2 HTML template")
    email_from = fields.Char(string="From", help="Sender email or Jinja2 expression")
    email_to = fields.Char(string="To (field)", help="Field name on record for recipient, e.g. email_from or partner_id.email")
    auto_delete = fields.Boolean(string="Auto-delete", default=True, help="Delete mail.mail after sending")

    def _render_template(self, template_str: str, record_dict: Dict[str, Any]) -> str:
        """Render Jinja2 template with record data. object is the record dict."""
        if not template_str or not isinstance(template_str, str):
            return ""
        try:
            t = Template(template_str)
            return t.render(object=record_dict, **record_dict)
        except TemplateError:
            return template_str

    def send_mail(self, res_id: int, auto_send: bool = True) -> Optional[Any]:
        """Render template for record res_id, create mail.mail, optionally send. Returns mail.mail or None."""
        env = getattr(self, "env", None)
        if not env:
            return None
        model_name = self.model_id
        if not model_name:
            return None
        ModelCls = env.get(model_name)
        if not ModelCls:
            return None
        fields_to_read = ["id", "name"]
        if hasattr(ModelCls, "_fields"):
            fields_to_read = list(ModelCls._fields.keys())
        recs = ModelCls.browse([res_id]).read(fields_to_read)
        if not recs:
            return None
        record_dict = recs[0]
        # Flatten Many2one to display_name for templates
        for k, v in list(record_dict.items()):
            if isinstance(v, (list, tuple)) and len(v) >= 2:
                record_dict[k] = v[1]  # (id, name)
            elif isinstance(v, (list, tuple)) and len(v) == 1:
                record_dict[k] = v[0]
        subject = self._render_template(self.subject or "", record_dict)
        body_html = self._render_template(self.body_html or "", record_dict)
        email_from = self._render_template(self.email_from or "", record_dict) or "noreply@localhost"
        email_to = ""
        if self.email_to:
            field_val = record_dict.get(self.email_to)
            if isinstance(field_val, (list, tuple)) and len(field_val) >= 2:
                rel_id = field_val[0]
                rel_name = str(field_val[1] or "")
                if rel_id:
                    if self.email_to == "partner_id":
                        Partner = env.get("res.partner")
                        if Partner:
                            pr = Partner.browse([rel_id]).read(["email", "email_formatted"])
                            if pr:
                                email_to = str(pr[0].get("email") or pr[0].get("email_formatted") or "").strip()
                    elif "." in self.email_to:
                        # Support partner_id.email style notation when value was flattened.
                        email_to = rel_name.strip()
            elif field_val:
                email_to = str(field_val).strip()
            if not email_to and self.email_to and "partner_id" in record_dict:
                # Common: email_to = "partner_id" -> get partner email
                pid = record_dict.get("partner_id")
                if isinstance(pid, (list, tuple)) and pid:
                    pid = pid[0]
                if pid:
                    Partner = env.get("res.partner")
                    if Partner:
                        pr = Partner.browse([pid]).read(["email"])
                        if pr and pr[0].get("email"):
                            email_to = str(pr[0]["email"]).strip()
        if not email_to:
            email_to = record_dict.get("email_from") or record_dict.get("email") or ""
            if isinstance(email_to, (list, tuple)):
                email_to = email_to[1] if len(email_to) >= 2 else str(email_to)
            email_to = str(email_to).strip() if email_to else ""
        if not email_to:
            return None
        MailMail = env.get("mail.mail")
        if not MailMail:
            return None
        vals = {
            "email_from": email_from,
            "email_to": email_to,
            "subject": subject or "(No subject)",
            "body_html": body_html or "<p></p>",
            "state": "outgoing",
            "res_model": model_name,
            "res_id": res_id,
        }
        mail = MailMail.create(vals)
        if auto_send:
            mail.send()
            if self.auto_delete:
                mail.unlink()
                return None
        return mail
