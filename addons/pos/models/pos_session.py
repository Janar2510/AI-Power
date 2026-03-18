"""POS session - open/close, cash control (Phase 227)."""

from core.orm import Model, fields


class PosSession(Model):
    _name = "pos.session"
    _description = "POS Session"

    name = fields.Char(string="Session", required=True, default="New")
    config_id = fields.Many2one("pos.config", string="Config", required=True)
    user_id = fields.Many2one("res.users", string="User", required=True)
    state = fields.Selection(
        selection=[
            ("opening", "Opening"),
            ("opened", "In Progress"),
            ("closing", "Closing"),
            ("closed", "Closed"),
        ],
        string="Status",
        default="opening",
    )
    cash_register_balance_start = fields.Float(string="Starting Balance", default=0.0)
    cash_register_balance_end = fields.Float(string="Ending Balance")
    order_ids = fields.One2many("pos.order", "session_id", string="Orders")

    @classmethod
    def create(cls, vals):
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if vals.get("name") == "New" or not vals.get("name"):
            IrSequence = env.get("ir.sequence") if env else None
            next_val = IrSequence.next_by_code("pos.session") if IrSequence else None
            vals = dict(vals, name=f"POS/{next_val:05d}" if next_val is not None else "New")
        return super().create(vals)
