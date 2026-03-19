"""Extended partner address columns."""

from core.orm import Model, fields


class ResPartnerAddressExtended(Model):
    _inherit = "res.partner"

    street_name = fields.Char(string="Street Name")
    street_number = fields.Char(string="Street Number")
    street_number2 = fields.Char(string="Street Number 2")
