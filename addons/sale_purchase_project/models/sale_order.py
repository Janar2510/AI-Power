"""Sale order bridge counters for sale_purchase_project (phase 302)."""

from core.orm import Model, api, fields


class SaleOrder(Model):
    _inherit = "sale.order"

    sale_purchase_project_auto_count = fields.Computed(
        compute="_compute_sale_purchase_project_auto_count",
        store=False,
        string="Sale/Purchase Project Auto Count",
    )

    @api.depends()
    def _compute_sale_purchase_project_auto_count(self):
        return [0] * len(self._ids)
