"""EMV QR code fields on account move (phase 321)."""

from core.orm import Model, fields


class AccountMove(Model):
    _inherit = "account.move"

    emv_qr_code_data = fields.Text(string="EMV QR Code Data")
