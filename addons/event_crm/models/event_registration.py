"""Extend event registrations with CRM lead link."""

from core.orm import Model, fields


class EventRegistrationCrm(Model):
    _inherit = "event.registration"

    lead_id = fields.Many2one("crm.lead", string="Lead/Opportunity", copy=False)
