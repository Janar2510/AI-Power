"""UBL/CII fields on account EDI format (phase 320)."""

from core.orm import Model, fields


class AccountEdiFormat(Model):
    _inherit = "account.edi.format"

    is_ubl_cii = fields.Boolean(string="Is UBL/CII", default=True)

    def _render_ubl_cii(self):
        return ""
