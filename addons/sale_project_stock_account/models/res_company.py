"""Anglo-saxon flag for sale/project stock analytics."""

from core.orm import Model, fields


class ResCompany(Model):
    _inherit = "res.company"

    anglo_saxon_accounting = fields.Boolean(string="Anglo-Saxon Accounting", default=False)
