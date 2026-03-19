"""CRM lead linkage for website event registrations (phase 315)."""

from core.orm import Model, fields


class EventRegistration(Model):
    _inherit = "event.registration"

    website_event_crm_lead_id = fields.Many2one("crm.lead", string="Website Event CRM Lead", ondelete="set null")
