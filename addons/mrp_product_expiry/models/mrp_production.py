"""MO expiry helpers around producing lot (plan-aligned minimal stubs)."""

from datetime import date

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
        lot = getattr(self, "lot_producing_id", None)
        if not lot:
            self.lot_producing_expiry_date = None
            self.lot_producing_expiry_state = "ok"
            return None
        expiry = getattr(lot, "use_date", None) or getattr(lot, "expiration_date", None)
        self.lot_producing_expiry_date = expiry
        if not expiry:
            self.lot_producing_expiry_state = "ok"
            return expiry
        today = date.today()
        if isinstance(expiry, date):
            if expiry < today:
                self.lot_producing_expiry_state = "expired"
            elif expiry <= today.replace(day=today.day):
                self.lot_producing_expiry_state = "warning"
            else:
                self.lot_producing_expiry_state = "ok"
        return expiry

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
        expiry = getattr(self, "lot_producing_expiry_date", None)
        if isinstance(expiry, date) and expiry < date.today():
            return True
        return False
