"""CRM leads originating from the website."""

from core.orm import Model, fields


class CrmLeadWebsite(Model):
    _inherit = "crm.lead"

    website_id = fields.Many2one("website", string="Website", copy=False)
    website_form_url = fields.Char(string="Form URL")
