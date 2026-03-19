"""Sales Team - team for sales/CRM."""

import random

from core.orm import Model, fields


class CrmTeam(Model):
    _name = "crm.team"
    _description = "Sales Team"
    _order = "sequence, id"

    name = fields.Char(string="Sales Team", required=True)
    sequence = fields.Integer(default=10)
    active = fields.Boolean(default=True)
    company_id = fields.Many2one("res.company", string="Company")
    user_id = fields.Many2one("res.users", string="Team Leader")
    crm_team_member_ids = fields.One2many(
        "crm.team.member",
        "crm_team_id",
        string="Sales Team Members",
    )
    color = fields.Integer(string="Color Index", default=lambda self: random.randint(1, 11))
