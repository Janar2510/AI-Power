"""Extend account.payment with check number and layout."""

from core.orm import Model, fields


class AccountPaymentCheck(Model):
    _inherit = "account.payment"

    check_number = fields.Char(string="Check Number", copy=False)
    check_amount_in_words = fields.Char(string="Amount in Words")
