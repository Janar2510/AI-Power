"""Lead mining automation field (phase 327)."""

from core.orm import Model, fields


class CrmIapLeadMiningRequest(Model):
    _inherit = "crm.iap.lead.mining.request"

    is_automated = fields.Boolean(string="Is Automated", default=False)
