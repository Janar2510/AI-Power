"""User model - for authentication."""

from core.orm import Model, fields


class ResUsers(Model):
    _name = "res.users"
    _description = "User"

    login = fields.Char(required=True)
    password = fields.Char()
    name = fields.Char(required=True)
    active = fields.Boolean(default=True)
    company_id = fields.Many2one("res.company", string="Company")
    group_ids = fields.Many2many(
        "res.groups",
        relation="res_users_res_groups_rel",
        column1="user_id",
        column2="group_id",
        string="Groups",
    )
