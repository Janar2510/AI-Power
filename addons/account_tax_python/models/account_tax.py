"""Python tax formula fields (phase 322)."""

from core.orm import Model, fields


class AccountTax(Model):
    _inherit = "account.tax"

    python_compute = fields.Text(string="Python Compute")
    python_applicable = fields.Text(string="Python Applicable")
