from core.orm import Model, fields


class PurchaseOrder(Model):
    _inherit = "purchase.order"

    receipt_count = fields.Integer(string="Receipts", compute="_compute_receipt_count", store=False)

    @classmethod
    def _compute_receipt_count(cls, recs):
        env = getattr(recs, "env", None)
        Picking = env.get("stock.picking") if env else None
        out = []
        for rec in recs:
            count = 0
            if Picking and rec.ids:
                row = rec.read(["name"])[0]
                name = (row.get("name") or "") if row else ""
                # Match pickings linked by purchase_id OR by origin (same as sale_stock picking_count).
                domain = [
                    "|",
                    ("purchase_id", "=", rec.ids[0]),
                    ("origin", "=", name),
                ]
                count = Picking.search_count(domain, env=env)
            out.append(count)
        return out
