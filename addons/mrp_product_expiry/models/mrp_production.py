"""MO expiry helpers around producing lot (plan-aligned minimal stubs)."""

from core.orm import Model, fields


class MrpProduction(Model):
    _inherit = "mrp.production"

    lot_producing_id = fields.Many2one("stock.lot", string="Lot Producing", ondelete="set null")
    lot_producing_expiry_date = fields.Date(string="Producing Lot Expiry", readonly=True)
    lot_producing_expiry_state = fields.Selection(
        selection=[("ok", "OK"), ("warning", "Warning"), ("expired", "Expired")],
        string="Producing Lot Expiry State",
        default="ok",
        readonly=True,
    )

    def _sync_lot_producing_expiry(self):
        """Stub: would copy expiry from lot_producing_id."""
        return None

    def pre_button_mark_done(self):
        confirm = self._check_expired_lots()
        if confirm:
            return confirm
        return True

    def _check_expired_lots(self):
        env = getattr(self, "env", None)
        ctx = getattr(env, "context", None) or {}
        if ctx.get("skip_expired"):
            return False
        return False
