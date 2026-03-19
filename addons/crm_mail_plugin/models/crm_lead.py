"""Mail plugin source on leads (phase 318)."""

from core.orm import Model, fields


class CrmLead(Model):
    _inherit = "crm.lead"

    mail_plugin_source = fields.Char(string="Mail Plugin Source", default="")
