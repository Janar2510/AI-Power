"""Project-level SMS hooks."""

from core.orm import Model, api, fields


class ProjectProjectSms(Model):
    _inherit = "project.project"

    sms_template_id = fields.Many2one("sms.template", string="SMS Template")

    def _send_sms(self):
        Sms = self.env.get("sms.sms") if getattr(self, "env", None) else None
        Partner = self.env.get("res.partner") if getattr(self, "env", None) else None
        if not Sms or not Partner:
            return
        for project in self:
            data = project.read(["partner_id", "sms_template_id", "name"])[0]
            partner = data.get("partner_id")
            template = data.get("sms_template_id")
            if not partner or not template:
                continue
            partner_id = partner[0] if isinstance(partner, (list, tuple)) else partner
            prow = Partner.browse(partner_id).read(["mobile", "phone"])[0]
            number = prow.get("mobile") or prow.get("phone")
            if not number:
                continue
            Sms.create(
                {
                    "number": number,
                    "partner_id": partner_id,
                    "body": f"Project update: {data.get('name') or ''}",
                }
            )

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        records._send_sms()
        return records

    def write(self, vals):
        result = super().write(vals)
        if "sms_template_id" in vals:
            self._send_sms()
        return result
