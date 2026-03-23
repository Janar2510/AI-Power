"""crm.lost.reason — reasons when marking opportunities as lost."""

from core.orm import Model, fields


class CrmLostReason(Model):
    _name = "crm.lost.reason"
    _description = "Lost Reason"

    name = fields.Char(required=True)
