"""MO ↔ repair (Odoo mrp_repair parity)."""

from core.orm import Model, fields


class MrpProduction(Model):
    _inherit = "mrp.production"

    repair_count = fields.Integer(string="Repair Orders Count", default=0)

    def action_view_repair_orders(self):
        return {"type": "ir.actions.act_window", "res_model": "repair.order"}
