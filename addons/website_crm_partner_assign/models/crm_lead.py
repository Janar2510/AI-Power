"""Partner assignment fields on leads (phase 327)."""

from core.orm import Model, fields


class CrmLead(Model):
    _inherit = "crm.lead"

    partner_assigned_id = fields.Many2one("res.partner", string="Assigned Partner", ondelete="set null")
