"""Extend sale.order with opportunity_id for sale_crm bridge."""

from core.orm import Model, fields


class SaleOrderCrm(Model):
    _inherit = "sale.order"

    opportunity_id = fields.Many2one(
        "crm.lead",
        string="Opportunity",
        copy=False,
    )
    origin = fields.Char(string="Source Document", copy=False)
