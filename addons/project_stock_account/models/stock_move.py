"""Stock move analytic distribution from project picking (Odoo project_stock_account parity)."""

from core.orm import Model


class StockMove(Model):
    _inherit = "stock.move"

    def _get_analytic_distribution(self):
        picking = getattr(self, "picking_id", None)
        pt = None
        if picking:
            pdata = picking.read(["picking_type_id"])
            ptid = pdata[0].get("picking_type_id") if pdata else None
            if isinstance(ptid, (list, tuple)) and ptid:
                ptid = ptid[0]
            if ptid:
                PT = self.env.get("stock.picking.type")
                if PT:
                    pt = PT.browse(ptid)
        if pt and getattr(pt, "analytic_costs", False) and picking:
            proj = picking.read(["project_id"])
            pid = proj[0].get("project_id") if proj else None
            if isinstance(pid, (list, tuple)) and pid:
                pid = pid[0]
            if pid:
                return {"project_id": pid}
        return {}

    def _prepare_analytic_line_values(self, account_field_values, amount, unit_amount):
        res = dict(account_field_values or {})
        res.setdefault("amount", amount)
        res.setdefault("unit_amount", unit_amount)
        picking = getattr(self, "picking_id", None)
        if picking:
            pdata = picking.read(["name"])
            res["name"] = (pdata[0].get("name") if pdata else None) or ""
            res["category"] = "picking_entry"
        return res

    def _get_valid_moves_domain(self):
        return [("picking_id.project_id", "!=", False), ("picking_type_id.analytic_costs", "!=", False)]

    def _prepare_analytic_lines(self):
        return []
