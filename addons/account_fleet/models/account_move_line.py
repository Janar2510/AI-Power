"""Journal items linked to fleet vehicles."""

from core.orm import Model, fields


class AccountMoveLineFleet(Model):
    _inherit = "account.move.line"

    vehicle_id = fields.Many2one("fleet.vehicle", string="Vehicle", copy=False)
