"""POS HR restaurant assignment helper field (phase 338)."""

from core.orm import Model, fields


class PosSession(Model):
    _inherit = "pos.session"

    restaurant_employee_assigned = fields.Boolean(string="Restaurant Employee Assigned", default=False)
