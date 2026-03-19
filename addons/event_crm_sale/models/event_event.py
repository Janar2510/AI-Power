"""Event-level CRM/sale bridge metadata (phase 303)."""

from core.orm import Model, fields


class EventEvent(Model):
    _inherit = "event.event"

    event_crm_sale_opportunity_id = fields.Many2one(
        "crm.lead",
        string="CRM Opportunity",
        ondelete="set null",
    )
