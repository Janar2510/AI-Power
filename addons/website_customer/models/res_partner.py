"""Website customer publishing on partners (phase 317)."""

from core.orm import Model, fields


class ResPartner(Model):
    _inherit = "res.partner"

    website_customer_published = fields.Boolean(string="Website Customer Published", default=False)
