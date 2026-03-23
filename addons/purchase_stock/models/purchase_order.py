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
                name = rec.name or ""
                if name:
                    domain = [
                        "|",
                        ("purchase_id", "=", rec.ids[0]),
                        ("origin", "=", name),
                    ]
                else:
                    domain = [("purchase_id", "=", rec.ids[0])]
                count = Picking.search_count(domain)
            out.append({"receipt_count": count})
        return out
