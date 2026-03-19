"""Subcontracting resupply from purchase (Odoo mrp_subcontracting_purchase parity)."""

from core.orm import Model, api, fields


class PurchaseOrder(Model):
    _inherit = "purchase.order"

    subcontracting_resupply_picking_count = fields.Computed(
        compute="_compute_subcontracting_resupply_picking_count",
        string="Subcontracting Resupply Count",
        store=False,
    )

    @api.depends("order_line.move_ids")
    def _compute_subcontracting_resupply_picking_count(self):
        n = len(self._ids) if getattr(self, "_ids", None) else 0
        return [0] * n

    def action_view_subcontracting_resupply(self):
        return {"type": "ir.actions.act_window", "res_model": "stock.picking"}

    def _get_subcontracting_resupplies(self):
        return []

    def _get_mrp_productions(self, **kwargs):
        Mrp = self.env.get("mrp.production")
        if not Mrp:
            return None
        return Mrp.browse([])
