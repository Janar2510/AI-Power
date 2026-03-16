"""Mail alias - map email address to model/action (Phase 130)."""

from core.orm import Model, fields


class MailAlias(Model):
    _name = "mail.alias"
    _description = "Email Alias"

    alias_name = fields.Char(required=True, string="Alias Email")
    alias_model = fields.Char(required=True, string="Model", default="crm.lead")
    alias_force = fields.Char(string="Default Values")
