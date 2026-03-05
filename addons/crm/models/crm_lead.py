"""CRM Lead model."""

from core.orm import Model, fields


class CrmLead(Model):
    _name = "crm.lead"
    _description = "Lead/Opportunity"

    name = fields.Char(required=True)
    type = fields.Selection(
        selection=[("lead", "Lead"), ("opportunity", "Opportunity")],
        string="Type",
        default="lead",
    )
    partner_id = fields.Many2one("res.partner", string="Contact")
    stage_id = fields.Many2one("crm.stage", string="Stage")
    expected_revenue = fields.Float()
    description = fields.Text()
    note_html = fields.Html(string="Notes")
    tag_ids = fields.Many2many("crm.tag", string="Tags")
    activity_ids = fields.One2many("crm.activity", "lead_id", string="Activities")
