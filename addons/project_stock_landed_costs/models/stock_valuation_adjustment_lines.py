"""Landed cost valuation lines with project analytics (Odoo project_stock_landed_costs parity)."""

from core.orm import Model, fields


class StockValuationAdjustmentLines(Model):
    _name = "stock.valuation.adjustment.lines"
    _description = "Stock Valuation Adjustment Lines"

    cost_id = fields.Many2one("stock.landed.cost", string="Landed Cost", ondelete="cascade")
    move_id = fields.Many2one("stock.move", string="Stock Move", ondelete="set null")

    def _prepare_account_move_line_values(self):
        res = {}
        rows = self.read(["cost_id", "move_id"])
        cost_id = rows[0].get("cost_id") if rows else None
        move_id = rows[0].get("move_id") if rows else None
        if isinstance(cost_id, (list, tuple)) and cost_id:
            cost_id = cost_id[0]
        if isinstance(move_id, (list, tuple)) and move_id:
            move_id = move_id[0]
        if cost_id and move_id:
            Cost = self.env.get("stock.landed.cost")
            Move = self.env.get("stock.move")
            if Cost and Move:
                c = Cost.browse(cost_id).read(["target_model"])
                tm = c[0].get("target_model") if c else None
                if tm == "picking":
                    mv = Move.browse(move_id)
                    pick = getattr(mv, "picking_id", None)
                    if pick:
                        pr = pick.read(["project_id"])
                        proj = pr[0].get("project_id") if pr else None
                        if isinstance(proj, (list, tuple)) and proj:
                            proj = proj[0]
                        if proj:
                            PP = self.env.get("project.project")
                            if PP:
                                dist = PP.browse(proj)._get_analytic_distribution()
                                if dist:
                                    res["analytic_distribution"] = dist
        return res
