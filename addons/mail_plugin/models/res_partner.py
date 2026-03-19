"""Mail plugin helpers on partners (phase 313)."""

from core.orm import Model, fields


class ResPartner(Model):
    _inherit = "res.partner"

    mail_plugin_partner_ref = fields.Char(string="Mail Plugin Partner Ref", default="")

    def mail_plugin_partner_link(self):
        return ""
