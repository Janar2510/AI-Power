"""Extend sale.order.line with margin for sale_margin."""

from core.orm import Model, api, fields


class SaleOrderLineMargin(Model):
    _inherit = "sale.order.line"

    purchase_price = fields.Float(
        string="Cost",
        compute="_compute_purchase_price",
        store=True,
        readonly=False,
        copy=False,
    )
    margin = fields.Float(
        string="Margin",
        compute="_compute_margin",
        store=True,
    )
    margin_percent = fields.Float(
        string="Margin (%)",
        compute="_compute_margin",
        store=True,
    )

    @api.depends("product_id")
    def _compute_purchase_price(self):
        for line in self:
            if not line.product_id:
                line.purchase_price = 0.0
                continue
            prod = line.product_id
            tmpl_id = prod.read(["product_template_id"])[0].get("product_template_id")
            if isinstance(tmpl_id, (list, tuple)) and tmpl_id:
                tmpl_id = tmpl_id[0]
            if not tmpl_id:
                line.purchase_price = 0.0
                continue
            Tmpl = line.env.get("product.template")
            cost = Tmpl.browse(tmpl_id).read(["standard_price"])[0].get("standard_price") or 0.0
            line.purchase_price = cost

    @api.depends("price_subtotal", "product_uom_qty", "purchase_price")
    def _compute_margin(self):
        for line in self:
            subtotal = line.read(["price_subtotal"])[0].get("price_subtotal") or 0.0
            qty = line.read(["product_uom_qty"])[0].get("product_uom_qty") or 0.0
            cost = line.read(["purchase_price"])[0].get("purchase_price") or 0.0
            line.margin = subtotal - (cost * qty)
            line.margin_percent = subtotal and (line.margin / subtotal) or 0.0
