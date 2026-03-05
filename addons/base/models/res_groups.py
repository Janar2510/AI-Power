"""res.groups - User groups for access control."""

from core.orm import Model, fields


class ResGroups(Model):
    _name = "res.groups"
    _description = "User Groups"

    name = fields.Char(required=True, string="Name")
    full_name = fields.Char(string="Technical Name")  # XML ID e.g. base.group_user
