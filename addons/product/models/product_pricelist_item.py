"""Product pricelist item (Phase 247)."""

from core.orm import Model, fields


class ProductPricelistItem(Model):
    _name = "product.pricelist.item"
    _description = "Pricelist Item"

    pricelist_id = fields.Many2one("product.pricelist", string="Pricelist", required=True, ondelete="cascade")
    product_id = fields.Many2one("product.product", string="Product")
    min_qty = fields.Float(string="Min. Quantity", default=0.0)
    price_surcharge = fields.Float(string="Price Surcharge", default=0.0)
    percent_price = fields.Float(string="Percentage Price", default=0.0)
    date_start = fields.Date(string="Start Date")
    date_end = fields.Date(string="End Date")
