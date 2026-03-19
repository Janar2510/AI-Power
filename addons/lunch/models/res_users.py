"""res.users lunch extension. Phase 260."""

from core.orm import Model, fields


class ResUsersLunch(Model):
    _inherit = "res.users"

    lunch_location_id = fields.Many2one("lunch.location", string="Lunch Location")
    last_lunch_location_id = fields.Many2one("lunch.location", string="Last Lunch Location")
