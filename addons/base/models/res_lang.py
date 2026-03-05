"""res.lang - Language (stub for Phase 32; defer full i18n)."""

from core.orm import Model, fields


class ResLang(Model):
    _name = "res.lang"
    _description = "Language"

    code = fields.Char(required=True, string="Locale Code")
    name = fields.Char(required=True, string="Name")
    active = fields.Boolean(string="Active", default=True)
