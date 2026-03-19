"""Mass mailing CRM bridge fields (phase 330)."""

from core.orm import Model, fields


class CrmLead(Model):
    _inherit = "crm.lead"

    mass_mailing_id = fields.Many2one("mailing.mailing", string="Mass Mailing", ondelete="set null")
    mailing_trace_ids = fields.Many2many(
        "mailing.trace",
        "crm_lead_mailing_trace_rel",
        "lead_id",
        "trace_id",
        string="Mailing Traces",
    )
