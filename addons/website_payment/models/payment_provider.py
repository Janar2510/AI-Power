"""Payment providers visible on websites."""

from core.orm import Model, fields


class PaymentProviderWebsite(Model):
    _inherit = "payment.provider"

    website_id = fields.Many2one("website", string="Website", copy=False)
    is_published = fields.Boolean(string="Published", default=True)
