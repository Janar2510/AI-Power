"""Account EDI proxy client model (phase 320)."""

from core.orm import Model, fields


class AccountEdiProxyClient(Model):
    _name = "account.edi.proxy_client"
    _description = "Account EDI Proxy Client"

    company_id = fields.Many2one("res.company", string="Company", ondelete="cascade")
    proxy_type = fields.Selection(
        selection=[("iap", "IAP"), ("custom", "Custom")],
        string="Proxy Type",
        default="iap",
    )
    edi_format_id = fields.Many2one("account.edi.format", string="EDI Format", ondelete="set null")
