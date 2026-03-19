"""IAP enrichment fields on leads (phase 318)."""

from core.orm import Model, fields


class CrmLead(Model):
    _inherit = "crm.lead"

    iap_enrich_done = fields.Boolean(string="IAP Enrich Done", default=False)
