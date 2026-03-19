"""Subcontracting account moves count on MO (plan field)."""

from core.orm import Model, api, fields


class MrpProduction(Model):
    _inherit = "mrp.production"

    subcontracting_account_move_count = fields.Computed(
        compute="_compute_subcontracting_account_move_count",
        store=False,
        string="Subcontracting Account Move Count",
    )

    @api.depends()
    def _compute_subcontracting_account_move_count(self):
        n = len(self._ids) if getattr(self, "_ids", None) else 0
        return [0] * n
