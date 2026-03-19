"""IBAN helpers on partner bank accounts (phase 308)."""

from core.orm import Model, api, fields


class ResPartnerBank(Model):
    _name = "res.partner.bank"
    _description = "Partner Bank"

    partner_id = fields.Many2one("res.partner", string="Partner", ondelete="cascade")
    acc_number = fields.Char(string="Account Number", default="")

    sanitized_acc_number = fields.Computed(
        compute="_compute_sanitized_acc_number",
        string="Sanitized Account Number",
        store=False,
    )

    @api.depends("acc_number")
    def _compute_sanitized_acc_number(self):
        return [""] * len(self._ids)

    def validate_iban(self, iban):
        return bool(iban)
