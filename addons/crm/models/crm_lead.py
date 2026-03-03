"""CRM Lead model."""

from core.orm import Model, fields


class CrmLead(Model):
    _name = "crm.lead"
    _description = "Lead/Opportunity"

    name = fields.Char(required=True)
    partner_id = fields.Many2one("res.partner", string="Contact")
    stage_id = fields.Many2one("crm.stage", string="Stage")
    expected_revenue = fields.Float()
    description = fields.Text()
