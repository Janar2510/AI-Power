from core.orm import Model, fields


class SaleOrder(Model):
    _inherit = "sale.order"

    picking_count = fields.Integer(string="Delivery Orders", compute="_compute_picking_count", store=False)

    @classmethod
    def _compute_picking_count(cls, recs):
        env = getattr(recs, "env", None)
        Picking = env.get("stock.picking") if env else None
        out = []
        for rec in recs:
            count = 0
            rid = rec.ids[0] if getattr(rec, "ids", None) else None
            name = (rec.read(["name"])[0].get("name") or "") if rid else ""
            if Picking and rid:
                count = Picking.search_count(
                    ["|", ("sale_id", "=", rid), ("origin", "=", name)],
                )
            out.append({"picking_count": count})
        return out
