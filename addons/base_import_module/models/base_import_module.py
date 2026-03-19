"""Module import wizard model (phase 319)."""

from core.orm import Model, fields


class BaseImportModule(Model):
    _name = "base.import.module"
    _description = "Base Import Module"

    name = fields.Char(string="Name", required=True)
    archive_name = fields.Char(string="Archive Name", default="")
