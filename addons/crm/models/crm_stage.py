"""CRM Stage model - pipeline stages for leads."""

from core.orm import Model, fields


class CrmStage(Model):
    _name = "crm.stage"
    _description = "CRM Stage"

    name = fields.Char(required=True)
    sequence = fields.Integer(default=10)
    fold = fields.Boolean(default=False)
    is_won = fields.Boolean(default=False)
