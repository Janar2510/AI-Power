"""Peppol registration model (phase 321)."""

from core.orm import Model, fields


class AccountPeppolRegistration(Model):
    _name = "account.peppol.registration"
    _description = "Account Peppol Registration"

    company_id = fields.Many2one("res.company", string="Company", ondelete="cascade")
    participant_id = fields.Char(string="Participant ID", default="")
    endpoint = fields.Char(string="Endpoint", default="")
