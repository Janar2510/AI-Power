"""Extend crm.lead with sale order bridge for opportunity to quotation."""

from core.orm import Model, api, fields


class CrmLeadSale(Model):
    _inherit = "crm.lead"

    order_ids = fields.One2many(
        "sale.order",
        "opportunity_id",
        string="Orders",
    )
    sale_amount_total = fields.Float(
        string="Sum of Orders",
        compute="_compute_sale_data",
    )
    quotation_count = fields.Integer(
        string="Number of Quotations",
        compute="_compute_sale_data",
    )
    sale_order_count = fields.Integer(
        string="Number of Sale Orders",
        compute="_compute_sale_data",
    )

    @api.depends("order_ids.state", "order_ids.amount_total")
    def _compute_sale_data(self):
        for lead in self:
            if not lead.order_ids:
                lead.sale_amount_total = 0.0
                lead.quotation_count = 0
                lead.sale_order_count = 0
                continue
            orders = lead.order_ids
            rows = orders.read(["state", "amount_total"])
            quotations = [r for r in rows if r.get("state") in ("draft",)]
            confirmed = [r for r in rows if r.get("state") == "sale"]
            lead.quotation_count = len(quotations)
            lead.sale_order_count = len(confirmed)
            lead.sale_amount_total = sum(r.get("amount_total") or 0.0 for r in confirmed)

    def action_new_quotation(self):
        """Return action to create a new quotation linked to this opportunity."""
        self.ensure_one()
        ctx = self._prepare_opportunity_quotation_context()
        return {
            "type": "ir.actions.act_window",
            "name": "New Quotation",
            "res_model": "sale.order",
            "view_mode": "form",
            "target": "current",
            "context": ctx,
        }

    def action_view_sale_quotation(self):
        """Return action to view quotations linked to this opportunity."""
        self.ensure_one()
        if not self.order_ids:
            return self._action_view_orders([], "Quotations")
        rows = self.order_ids.read(["id", "state"])
        order_ids = [r["id"] for r in rows if r.get("state") in ("draft",)]
        return self._action_view_orders(order_ids, "Quotations")

    def action_view_sale_order(self):
        """Return action to view confirmed orders linked to this opportunity."""
        self.ensure_one()
        if not self.order_ids:
            return self._action_view_orders([], "Sales Orders")
        rows = self.order_ids.read(["id", "state"])
        order_ids = [r["id"] for r in rows if r.get("state") == "sale"]
        return self._action_view_orders(order_ids, "Sales Orders")

    def _action_view_orders(self, order_ids, name):
        """Helper to build act_window for orders/quotations."""
        action = {
            "type": "ir.actions.act_window",
            "name": name,
            "res_model": "sale.order",
            "view_mode": "list,form",
            "domain": [("opportunity_id", "=", self.id)],
        }
        if len(order_ids) == 1:
            action["view_mode"] = "form"
            action["res_id"] = order_ids[0]
        return action

    def _prepare_opportunity_quotation_context(self):
        """Prepare context for new quotation from opportunity."""
        self.ensure_one()
        ctx = {
            "default_opportunity_id": self.id,
            "default_partner_id": self.partner_id.id if self.partner_id else False,
            "default_origin": self.name or "",
        }
        return ctx
