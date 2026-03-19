"""Mail bot partner reference on users (phase 303)."""

from core.orm import Model, fields


class ResUsers(Model):
    _inherit = "res.users"

    mail_bot_partner_ref = fields.Char(string="Mail Bot Partner Ref", default="")
