"""Project stock counters and actions."""

from core.orm import Model, api, fields


class ProjectProjectStock(Model):
    _inherit = "project.project"

    delivery_count = fields.Integer(string="Delivery Orders", compute="_compute_picking_counts")
    receipt_count = fields.Integer(string="Receipts", compute="_compute_picking_counts")
    picking_count = fields.Integer(string="Stock Moves", compute="_compute_picking_counts")

    @api.depends("name")
    def _compute_picking_counts(self):
        Picking = self.env.get("stock.picking") if getattr(self, "env", None) else None
        PickingType = self.env.get("stock.picking.type") if getattr(self, "env", None) else None
        incoming_ids = PickingType.search([("code", "=", "incoming")]).ids if PickingType else []
        outgoing_ids = PickingType.search([("code", "=", "outgoing")]).ids if PickingType else []
        for project in self:
            if not Picking:
                project.delivery_count = project.receipt_count = project.picking_count = 0
                continue
            project.picking_count = Picking.search_count([("project_id", "=", project.id)])
            project.delivery_count = Picking.search_count([
                ("project_id", "=", project.id),
                ("picking_type_id", "in", outgoing_ids or [-1]),
            ])
            project.receipt_count = Picking.search_count([
                ("project_id", "=", project.id),
                ("picking_type_id", "in", incoming_ids or [-1]),
            ])

    def _get_picking_domain(self, picking_type=None):
        self.ensure_one()
        domain = [("project_id", "=", self.id)]
        if not picking_type:
            return domain
        PickingType = self.env.get("stock.picking.type") if getattr(self, "env", None) else None
        type_ids = PickingType.search([("code", "=", picking_type)]).ids if PickingType else []
        return domain + [("picking_type_id", "in", type_ids or [-1])]

    def action_open_deliveries(self):
        self.ensure_one()
        return {
            "type": "ir.actions.act_window",
            "res_model": "stock.picking",
            "view_mode": "list,form",
            "domain": self._get_picking_domain("outgoing"),
        }

    def action_open_receipts(self):
        self.ensure_one()
        return {
            "type": "ir.actions.act_window",
            "res_model": "stock.picking",
            "view_mode": "list,form",
            "domain": self._get_picking_domain("incoming"),
        }

    def action_open_all_pickings(self):
        self.ensure_one()
        return {
            "type": "ir.actions.act_window",
            "res_model": "stock.picking",
            "view_mode": "list,form",
            "domain": self._get_picking_domain(),
        }
