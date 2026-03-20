"""res.lang - Language (stub for Phase 32; defer full i18n)."""

from core.orm import Model, fields


class ResLang(Model):
    _name = "res.lang"
    _description = "Language"

    code = fields.Char(required=True, string="Locale Code")
    name = fields.Char(required=True, string="Name")
    active = fields.Boolean(string="Active", default=True)
    date_format = fields.Char(string="Date Format", default="%Y-%m-%d")
    time_format = fields.Char(string="Time Format", default="%H:%M:%S")
    decimal_point = fields.Char(string="Decimal Separator", default=".")
    thousands_sep = fields.Char(string="Thousands Separator", default=",")
    direction = fields.Selection(
        selection=[("ltr", "Left-to-Right"), ("rtl", "Right-to-Left")],
        string="Text Direction",
        default="ltr",
    )
