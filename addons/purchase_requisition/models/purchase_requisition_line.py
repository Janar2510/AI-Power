"""Purchase requisition line."""

from core.orm import Model, fields


class PurchaseRequisitionLine(Model):
    _name = "purchase.requisition.line"
    _description = "Purchase Requisition Line"

    requisition_id = fields.Many2one(
        "purchase.requisition",
        string="Agreement",
        required=True,
        ondelete="cascade",
    )
    product_id = fields.Many2one("product.product", string="Product", required=True)
    product_qty = fields.Float(string="Quantity", default=1.0)
    price_unit = fields.Float(string="Unit Price", default=0.0)
    currency_id = fields.Many2one("res.currency", string="Currency")
    schedule_date = fields.Date(string="Delivery Date")
