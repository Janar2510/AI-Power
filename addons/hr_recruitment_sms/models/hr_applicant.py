"""Applicant SMS thread (plan fields)."""

from core.orm import Model, api, fields


class HrApplicant(Model):
    _inherit = "hr.applicant"

    sms_ids = fields.One2many("sms.sms", "applicant_id", string="SMS")
    sms_count = fields.Computed(
        compute="_compute_sms_count",
        store=False,
        string="SMS Count",
    )

    @api.depends()
    def _compute_sms_count(self):
        Sms = self.env.get("sms.sms")
        if not Sms or not self.ids:
            return [0] * len(self._ids)
        out = []
        for aid in self._ids:
            out.append(len(Sms.search([("applicant_id", "=", aid)]).ids))
        return out

    def action_send_sms(self):
        return {"type": "ir.actions.act_window", "res_model": "sms.sms"}
