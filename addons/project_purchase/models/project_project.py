"""Project purchase counters and action."""

from core.orm import Model, api, fields


class ProjectProjectPurchase(Model):
    _inherit = "project.project"

    purchase_orders_count = fields.Integer(
        string="Purchase Orders",
        compute="_compute_purchase_orders_count",
    )

    @api.depends("name")
    def _compute_purchase_orders_count(self):
        PurchaseOrder = self.env.get("purchase.order") if getattr(self, "env", None) else None
        for project in self:
            if not PurchaseOrder:
                project.purchase_orders_count = 0
                continue
            project.purchase_orders_count = PurchaseOrder.search_count(
                [("project_id", "=", project.id), ("order_line", "!=", False)]
            )

    def action_open_project_purchase_orders(self):
        self.ensure_one()
        return {
            "type": "ir.actions.act_window",
            "name": "Purchase Orders",
            "res_model": "purchase.order",
            "view_mode": "list,form",
            "domain": [("project_id", "=", self.id)],
            "context": {"default_project_id": self.id},
        }
