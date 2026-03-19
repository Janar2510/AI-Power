"""SMS linked to stock pickings."""

from core.orm import Model, fields


class SmsSmsStock(Model):
    _inherit = "sms.sms"

    picking_id = fields.Many2one("stock.picking", string="Transfer", copy=False)
