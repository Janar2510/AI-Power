"""CRM Tag - tags for leads/opportunities."""

from random import randint

from core.orm import Model, fields


class CrmTag(Model):
    _name = "crm.tag"
    _description = "CRM Tag"

    name = fields.Char(string="Tag Name", required=True)
    color = fields.Integer(string="Color", default=lambda self: randint(1, 11))
