"""Extend product.template with service_to_purchase for sale_purchase."""

from core.orm import Model, fields


class ProductTemplatePurchase(Model):
    _inherit = "product.template"

    service_to_purchase = fields.Boolean(
        string="Subcontract Service",
        default=False,
        copy=False,
        help="If set, selling this service will auto-create a purchase order to the vendor.",
    )
