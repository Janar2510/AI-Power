"""Extend sale.order.line with purchase_line_ids and service-to-purchase generation."""

from core.orm import Model, api, fields


class SaleOrderLinePurchase(Model):
    _inherit = "sale.order.line"

    purchase_line_ids = fields.One2many(
        "purchase.order.line",
        "sale_line_id",
        string="Generated Purchase Lines",
        readonly=True,
    )

    def _purchase_service_generation(self):
        """Create purchase orders for service lines with service_to_purchase and vendor."""
        if not self:
            return
        env = getattr(self, "env", None)
        if not env:
            return
        Supplierinfo = env.get("product.supplierinfo")
        PurchaseOrder = env.get("purchase.order")
        PurchaseLine = env.get("purchase.order.line")
        Product = env.get("product.product")
        if not all([Supplierinfo, PurchaseOrder, PurchaseLine, Product]):
            return
        for line in self:
            if not line.product_id:
                continue
            prod = line.product_id
            prod_data = prod.read(["product_template_id", "type", "name"])[0]
            if prod_data.get("type") != "service":
                continue
            tmpl_id = prod_data.get("product_template_id")
            if isinstance(tmpl_id, (list, tuple)) and tmpl_id:
                tmpl_id = tmpl_id[0]
            if not tmpl_id:
                continue
            tmpl = env.get("product.template").browse(tmpl_id)
            if not tmpl.read(["service_to_purchase"])[0].get("service_to_purchase"):
                continue
            suppliers = Supplierinfo.search([("product_tmpl_id", "=", tmpl_id)], limit=1)
            if not suppliers or not suppliers.ids:
                continue
            supp = suppliers.browse(suppliers.ids[0])
            supp_data = supp.read(["partner_id", "price"])[0]
            partner_id = supp_data.get("partner_id")
            if isinstance(partner_id, (list, tuple)) and partner_id:
                partner_id = partner_id[0]
            if not partner_id:
                continue
            price = supp_data.get("price") or 0.0
            order = line.order_id
            order_data = order.read(["name", "partner_id"])[0]
            order_name = order_data.get("name") or ""
            existing_po = PurchaseOrder.search([
                ("partner_id", "=", partner_id),
                ("state", "=", "draft"),
                ("origin", "ilike", order_name),
            ], limit=1)
            if existing_po and existing_po.ids:
                po = existing_po.browse(existing_po.ids[0])
            else:
                po = PurchaseOrder.create({
                    "partner_id": partner_id,
                    "origin": order_name,
                })
            PurchaseLine.create({
                "order_id": po.id,
                "product_id": prod.id,
                "name": prod_data.get("name") or "",
                "product_qty": line.read(["product_uom_qty"])[0].get("product_uom_qty") or 1.0,
                "price_unit": price,
                "sale_line_id": line.id,
            })
