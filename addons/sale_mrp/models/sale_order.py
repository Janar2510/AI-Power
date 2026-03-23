"""Extend sale.order with manufacturing order count."""

from core.orm import Model, api, fields


class SaleOrderMrp(Model):
    _inherit = "sale.order"

    production_count = fields.Integer(
        string="Manufacturing Count",
        compute="_compute_production_count",
    )

    @api.depends("order_line.mrp_production_ids")
    def _compute_production_count(self):
        for order in self:
            prod_ids = set()
            for line in order.order_line or []:
                for prod in line.mrp_production_ids or []:
                    if prod.id:
                        prod_ids.add(prod.id)
            order.production_count = len(prod_ids)

    def _action_confirm_sale_core(self):
        """Confirm sale then generate MOs for lines with manufacture-on-order + BOM (Phase 490)."""
        res = super()._action_confirm_sale_core()
        self._sale_mrp_create_manufacturing_orders()
        return res

    def _sale_mrp_create_manufacturing_orders(self):
        env = getattr(self, "env", None)
        if not env:
            return
        Line = env.get("sale.order.line")
        Mrp = env.get("mrp.production")
        Bom = env.get("mrp.bom")
        Product = env.get("product.product")
        Template = env.get("product.template")
        if not all([Line, Mrp, Bom, Product, Template]):
            return
        for order in self:
            oid = order.ids[0] if order.ids else None
            if not oid:
                continue
            lines = Line.search([("order_id", "=", oid)])
            for line in lines:
                lid = line.ids[0] if line.ids else None
                if not lid:
                    continue
                row = line.read(["product_id", "product_uom_qty", "mrp_production_ids"])[0]
                pid = row.get("product_id")
                if isinstance(pid, (list, tuple)) and pid:
                    pid = pid[0]
                if not pid:
                    continue
                pdata = Product.browse(pid).read(["product_template_id"])[0]
                tid = pdata.get("product_template_id")
                if isinstance(tid, (list, tuple)) and tid:
                    tid = tid[0]
                if not tid:
                    continue
                trow = Template.browse(tid).read(["manufacture_on_order"])[0]
                if not trow.get("manufacture_on_order"):
                    continue
                boms = Bom.search([("product_id", "=", pid), ("type", "=", "normal")], limit=1)
                if not boms.ids:
                    continue
                mo = Mrp.create({
                    "product_id": pid,
                    "bom_id": boms.ids[0],
                    "product_qty": float(row.get("product_uom_qty") or 1.0),
                    "origin_sale_line_id": lid,
                })
                mo_id = mo.ids[0] if hasattr(mo, "ids") and mo.ids else getattr(mo, "id", None)
                if not mo_id:
                    continue
                ex = row.get("mrp_production_ids") or []
                ex_ids = [x[0] if isinstance(x, (list, tuple)) and x else x for x in ex if x]
                line.write({"mrp_production_ids": [(6, 0, ex_ids + [mo_id])]})
                mo.action_confirm()
