"""Restrict AAL moves when anglo-saxon + reinvoicing (Odoo sale_project_stock_account parity)."""

from core.orm import Model


class StockMove(Model):
    _inherit = "stock.move"

    def _get_valid_moves_domain(self):
        domain = [("picking_id.project_id", "!=", False)]
        Comp = self.env.get("res.company")
        if Comp:
            rows = Comp.search([], limit=1)
            if rows.ids:
                ang = rows.read(["anglo_saxon_accounting"])
                if ang and ang[0].get("anglo_saxon_accounting"):
                    domain.append(("product_id.expense_policy", "not in", ("sales_price", "cost")))
        return domain
