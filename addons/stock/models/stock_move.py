"""Stock move (Phase 116)."""

from core.orm import Model, api, fields


class StockMove(Model):
    _name = "stock.move"
    _description = "Stock Move"

    name = fields.Char(string="Description")
    product_id = fields.Many2one("product.product", string="Product", required=True)
    product_uom_qty = fields.Float(string="Demand", default=1.0)
    quantity_reserved = fields.Float(
        string="Reserved quantity",
        default=0.0,
        help="Qty reserved on quants at source (Phase 530 partial reservation).",
    )
    lot_id = fields.Many2one("stock.lot", string="Lot/Serial", ondelete="set null")  # Phase 198
    picking_id = fields.Many2one("stock.picking", string="Transfer", ondelete="cascade")
    location_id = fields.Many2one("stock.location", string="Source Location", required=True)
    location_dest_id = fields.Many2one("stock.location", string="Destination Location", required=True)
    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("partial", "Partially Available"),
            ("assigned", "Available"),
            ("done", "Done"),
            ("cancel", "Cancelled"),
        ],
        string="Status",
        default="draft",
    )

    def _stock_tier_c_valuation_move_stub(self, product_id: int, cogs_value: float, ref_name: str) -> None:
        """Phase 571 Tier C: best-effort draft ``account.move`` when enabled on company (account optional)."""
        env = getattr(self, "env", None)
        if not env or cogs_value <= 0:
            return
        Move = env.get("account.move")
        MoveLine = env.get("account.move.line")
        Account = env.get("account.account")
        Journal = env.get("account.journal")
        Company = env.get("res.company")
        if not Move or not MoveLine or not Account or not Journal or not Company:
            return
        crows = Company.search_read([], ["stock_valuation_auto_account_move"], limit=1)
        if not crows or not crows[0].get("stock_valuation_auto_account_move"):
            return
        j = Journal.search([("type", "=", "general")], limit=1)
        if not j.ids:
            j = Journal.search([], limit=1)
        if not j.ids:
            return
        exp = Account.search([("account_type", "=", "expense")], limit=1)
        ast = Account.search([("account_type", "=", "asset_current")], limit=1)
        if not exp.ids or not ast.ids:
            return
        origin = f"STK-COGS:{ref_name or product_id}"
        if Move.search([("invoice_origin", "=", origin)], limit=1).ids:
            return
        mv = Move.create({
            "name": "New",
            "journal_id": j.ids[0],
            "move_type": "entry",
            "invoice_origin": origin,
            "state": "draft",
        })
        mid = mv.id if hasattr(mv, "id") else (mv.ids[0] if getattr(mv, "ids", None) else None)
        if not mid:
            return
        MoveLine.create({
            "move_id": mid,
            "account_id": exp.ids[0],
            "name": f"COGS {product_id}",
            "debit": cogs_value,
            "credit": 0.0,
        })
        MoveLine.create({
            "move_id": mid,
            "account_id": ast.ids[0],
            "name": f"Stock out {product_id}",
            "debit": 0.0,
            "credit": cogs_value,
        })
