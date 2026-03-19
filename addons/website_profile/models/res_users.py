"""Website profile fields on users (phase 317)."""

from core.orm import Model, fields


class ResUsers(Model):
    _inherit = "res.users"

    website_profile_bio = fields.Text(string="Website Profile Bio", default="")
