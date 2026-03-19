"""Extend CRM leads with event registration links."""

from core.orm import Model, api, fields


class CrmLeadEvent(Model):
    _inherit = "crm.lead"

    registration_ids = fields.One2many(
        "event.registration",
        "lead_id",
        string="Event Registrations",
        copy=False,
    )
    event_registration_count = fields.Integer(
        string="Registration Count",
        compute="_compute_event_registration_count",
    )

    @api.depends("registration_ids")
    def _compute_event_registration_count(self):
        for lead in self:
            lead.event_registration_count = len(lead.registration_ids) if lead.registration_ids else 0
