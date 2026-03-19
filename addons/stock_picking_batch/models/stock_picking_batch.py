"""Batch of stock transfers (Phase 305)."""

from core.orm import Model, fields


class StockPickingBatch(Model):
    _name = "stock.picking.batch"
    _description = "Stock Picking Batch"

    name = fields.Char(string="Name", required=True)
    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("in_progress", "In Progress"),
            ("done", "Done"),
        ],
        string="State",
        default="draft",
    )
    picking_ids = fields.One2many("stock.picking", "batch_id", string="Pickings")
    user_id = fields.Many2one("res.users", string="Responsible", ondelete="set null")
