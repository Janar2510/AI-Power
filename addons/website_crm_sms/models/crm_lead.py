"""Website CRM SMS field (phase 326)."""

from core.orm import Model, fields


class CrmLead(Model):
    _inherit = "crm.lead"

    website_sms_enabled = fields.Boolean(string="Website SMS Enabled", default=False)
