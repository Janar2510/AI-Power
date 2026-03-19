"""Website partner publishing on partners (phase 317)."""

from core.orm import Model, fields


class ResPartner(Model):
    _inherit = "res.partner"

    website_partner_published = fields.Boolean(string="Website Partner Published", default=False)
