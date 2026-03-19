"""Partner GLN extension (phase 320)."""

from core.orm import Model, fields


class ResPartner(Model):
    _inherit = "res.partner"

    gln = fields.Char(string="GLN", default="")

    def _check_gln(self):
        return True
