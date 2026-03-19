"""Stock pickings with related SMS messages."""

from core.orm import Model, api, fields


class StockPickingSms(Model):
    _inherit = "stock.picking"

    sms_ids = fields.One2many(
        "sms.sms",
        "picking_id",
        string="SMS",
        readonly=True,
    )
    sms_count = fields.Integer(
        string="SMS Count",
        compute="_compute_sms_count",
    )

    @api.depends("sms_ids")
    def _compute_sms_count(self):
        for picking in self:
            picking.sms_count = len(picking.sms_ids) if picking.sms_ids else 0
