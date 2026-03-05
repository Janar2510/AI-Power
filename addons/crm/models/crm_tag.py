"""crm.tag - Lead tags (Many2many demo)."""

from core.orm import Model, fields


class CrmTag(Model):
    _name = "crm.tag"
    _description = "Lead Tag"

    name = fields.Char(required=True)
