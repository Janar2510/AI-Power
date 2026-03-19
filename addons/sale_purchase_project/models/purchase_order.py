"""Sale/purchase/project bridge fields (phase 302)."""

from core.orm import Model, api, fields


class PurchaseOrder(Model):
    _inherit = "purchase.order"

    sale_project_id = fields.Computed(
        compute="_compute_sale_project_id",
        string="Sale Project",
        store=False,
    )

    @api.depends("sale_order_id")
    def _compute_sale_project_id(self):
        return [False] * len(self._ids)
