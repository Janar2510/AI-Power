"""CRM IAP lead mining request model (phase 318)."""

from core.orm import Model, fields


class CrmIapLeadMiningRequest(Model):
    _name = "crm.iap.lead.mining.request"
    _description = "CRM IAP Lead Mining Request"

    lead_id = fields.Many2one("crm.lead", string="Lead", ondelete="cascade")
    query = fields.Char(string="Query", default="")
