"""Sale UBL generation fields (phase 322)."""

from core.orm import Model, fields


class SaleOrder(Model):
    _inherit = "sale.order"

    edi_ubl_generated = fields.Boolean(string="EDI UBL Generated", default=False)
