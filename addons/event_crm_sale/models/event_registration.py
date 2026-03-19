"""Event/CRM/sale registration bridge (phase 303)."""

from core.orm import Model, fields


class EventRegistration(Model):
    _inherit = "event.registration"

    sale_order_line_id = fields.Many2one(
        "sale.order.line",
        string="Sale Order Line",
        ondelete="set null",
    )
    lead_id = fields.Many2one(
        "crm.lead",
        string="Lead",
        ondelete="set null",
    )
