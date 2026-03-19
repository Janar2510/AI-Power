"""Company website email contact bridge (phase 306)."""

from core.orm import Model, fields


class ResCompany(Model):
    _inherit = "res.company"

    website_mail_contact_email = fields.Char(string="Website Mail Contact Email")
