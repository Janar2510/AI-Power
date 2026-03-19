"""BoM repair stats (plan: repair_count)."""

from core.orm import Model, api, fields


class MrpBom(Model):
    _inherit = "mrp.bom"

    repair_count = fields.Computed(
        compute="_compute_repair_count",
        store=False,
        string="Repair Count",
    )

    @api.depends()
    def _compute_repair_count(self):
        Repair = self.env.get("repair.order")
        if not Repair or not self.ids:
            return [0] * len(self._ids)
        out = []
        for bid in self._ids:
            out.append(len(Repair.search([("bom_id", "=", bid)]).ids))
        return out
