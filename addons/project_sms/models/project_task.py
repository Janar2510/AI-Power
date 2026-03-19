"""Task-level SMS hooks."""

from core.orm import Model, api


class ProjectTaskSms(Model):
    _inherit = "project.task"

    def _send_sms(self):
        Sms = self.env.get("sms.sms") if getattr(self, "env", None) else None
        Partner = self.env.get("res.partner") if getattr(self, "env", None) else None
        Project = self.env.get("project.project") if getattr(self, "env", None) else None
        if not Sms or not Partner or not Project:
            return
        for task in self:
            task_data = task.read(["name", "project_id", "stage_id"])[0]
            project = task_data.get("project_id")
            if not project:
                continue
            project_id = project[0] if isinstance(project, (list, tuple)) else project
            project_data = Project.browse(project_id).read(["partner_id", "sms_template_id"])[0]
            partner = project_data.get("partner_id")
            template = project_data.get("sms_template_id")
            if not partner or not template:
                continue
            partner_id = partner[0] if isinstance(partner, (list, tuple)) else partner
            partner_row = Partner.browse(partner_id).read(["mobile", "phone"])[0]
            number = partner_row.get("mobile") or partner_row.get("phone")
            if not number:
                continue
            Sms.create(
                {
                    "number": number,
                    "partner_id": partner_id,
                    "body": f"Task update: {task_data.get('name') or ''}",
                }
            )

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        records._send_sms()
        return records

    def write(self, vals):
        result = super().write(vals)
        if "stage_id" in vals:
            self._send_sms()
        return result
