"""SEPA QR code data on partner bank (phase 321)."""

from core.orm import Model, fields


class ResPartnerBank(Model):
    _inherit = "res.partner.bank"

    sepa_qr_code_data = fields.Text(string="SEPA QR Code Data")
