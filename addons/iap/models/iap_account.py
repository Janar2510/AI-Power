"""iap.account - Credit account for IAP services. Phase 258."""

from core.orm import Model, fields


class IapAccount(Model):
    """IAP credit account per service and company."""

    _name = "iap.account"
    _description = "IAP Account"

    service_name = fields.Char(string="Service", required=True)
    account_token = fields.Char(string="Account Token")
    company_id = fields.Many2one("res.company", string="Company")
