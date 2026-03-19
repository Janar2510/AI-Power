"""IAP reveal fields on leads (phase 327)."""

from core.orm import Model, fields


class CrmLead(Model):
    _inherit = "crm.lead"

    reveal_ip = fields.Char(string="Reveal IP", default="")
    reveal_rule_id = fields.Many2one("crm.iap.reveal.rule", string="Reveal Rule", ondelete="set null")
