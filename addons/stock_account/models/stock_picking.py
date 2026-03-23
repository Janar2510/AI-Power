from core.orm import Model, fields

from addons.stock.models.stock_picking import _stock_picking_run_action_validate


class StockPicking(Model):
    _inherit = "stock.picking"

    valuation_state = fields.Selection(
        [("pending", "Pending"), ("posted", "Posted")],
        string="Valuation State",
        default="pending",
    )

    def action_validate(self):
        """Mark valuation pending -> posted when transfer completes (Phase 525)."""
        snapshots = {rid: self.browse(rid).read(["state"])[0].get("state") for rid in self.ids}
        res = _stock_picking_run_action_validate(self)
        for rid in self.ids:
            if snapshots.get(rid) not in ("draft", "assigned"):
                continue
            if self.browse(rid).read(["state"])[0].get("state") == "done":
                self.browse(rid).write({"valuation_state": "posted"})
        return res

    @classmethod
    def action_post_valuation(cls, ids, env=None):
        recs = cls.browse(ids if isinstance(ids, list) else [ids])
        recs.write({"valuation_state": "posted"})
        return True
