"""Extend crm.lead with SMS helpers."""

from core.orm import Model, api, fields


class CrmLeadSms(Model):
    _inherit = "crm.lead"

    sms_ids = fields.One2many(
        "sms.sms",
        "lead_id",
        string="SMS",
        readonly=True,
    )
    sms_count = fields.Integer(
        string="SMS Count",
        compute="_compute_sms_count",
    )

    @api.depends("sms_ids")
    def _compute_sms_count(self):
        for lead in self:
            lead.sms_count = len(lead.sms_ids) if lead.sms_ids else 0
