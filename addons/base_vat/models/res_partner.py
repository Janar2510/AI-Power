"""VAT helpers on partners (phase 308)."""

from core.orm import Model


class ResPartner(Model):
    _inherit = "res.partner"

    def check_vat(self, vat):
        return bool(vat)
