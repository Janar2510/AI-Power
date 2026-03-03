"""CRM Activity model - tasks/activities linked to leads."""

from core.orm import Model, fields


class CrmActivity(Model):
    _name = "crm.activity"
    _description = "CRM Activity"

    name = fields.Char(required=True)
    lead_id = fields.Integer()  # crm.lead id
    note = fields.Text()
    date_deadline = fields.Date()
