"""Extend ir.actions.server with template_id and email state (Phase 178)."""

from core.orm import Model, fields


class IrActionsServer(Model):
    _inherit = "ir.actions.server"

    template_id = fields.Many2one("mail.template", string="Email Template")

    def run(self, records=None):
        """Execute server action. Handle state=email with mail.template."""
        for action in self:
            data = action.read(["state", "template_id"]) or [{}]
            vals = data[0] if data else {}
            state = vals.get("state")
            if state == "email":
                template_id = vals.get("template_id")
                if isinstance(template_id, (list, tuple)) and template_id:
                    template_id = template_id[0]
                if template_id and records and records.ids:
                    self._run_email(action, records, template_id)
                    return
        try:
            return super().run(records=records)
        except TypeError:
            # Recordset as self: super() fails; run base logic directly (Phase 226)
            for action in self:
                data = action.read(["state", "code"]) or [{}]
                vals = data[0] if data else {}
                state = vals.get("state")
                code = vals.get("code")
                if state == "code" and code:
                    self._run_code(action, records, code)
                elif state == "object_write" and records:
                    self._run_object_write(action, records)

    def _run_email(self, action, records, template_id: int):
        """Send email using mail.template for each record."""
        env = getattr(self, "env", None)
        if not env:
            return
        Template = env.get("mail.template")
        if not Template:
            return
        template = Template.browse([template_id])
        if not template.ids:
            return
        for rid in records.ids:
            template.send_mail(rid, auto_send=True)
