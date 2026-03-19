"""Resource/mail bridge fields on resources (phase 303)."""

from core.orm import Model, fields


class ResourceResource(Model):
    _inherit = "resource.resource"

    resource_mail_alias_id = fields.Many2one(
        "mail.alias",
        string="Resource Mail Alias",
        ondelete="set null",
    )
