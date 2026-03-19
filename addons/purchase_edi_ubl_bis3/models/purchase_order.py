"""Purchase UBL receipt fields (phase 322)."""

from core.orm import Model, fields


class PurchaseOrder(Model):
    _inherit = "purchase.order"

    edi_ubl_received = fields.Boolean(string="EDI UBL Received", default=False)
