"""Website publication field on mail groups (phase 327)."""

from core.orm import Model, fields


class MailGroup(Model):
    _inherit = "mail.group"

    website_published = fields.Boolean(string="Website Published", default=False)
