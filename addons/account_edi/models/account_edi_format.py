"""Account EDI format model (phase 320)."""

from core.orm import Model, fields


class AccountEdiFormat(Model):
    _name = "account.edi.format"
    _description = "Account EDI Format"

    name = fields.Char(string="Name", default="")
    code = fields.Char(string="Code", default="")
