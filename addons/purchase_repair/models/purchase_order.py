"""PO ↔ repair orders (Phase 305)."""

from core.orm import Model, fields


class PurchaseOrder(Model):
    _inherit = "purchase.order"

    repair_order_ids = fields.One2many("repair.order", "purchase_order_id", string="Repair Orders")
