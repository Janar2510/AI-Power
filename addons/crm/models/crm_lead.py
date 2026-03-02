"""CRM Lead model."""

from core.orm import Model, fields


class CrmLead(Model):
    _name = "crm.lead"
    _description = "Lead/Opportunity"

    name = fields.Char(required=True)
    partner_id = fields.Integer()  # res.partner id
    stage = fields.Char(default="new")  # new, qualified, proposal, won, lost
    expected_revenue = fields.Float()
    description = fields.Text()
