"""Mondial Relay fields on sale orders (phase 328)."""

from core.orm import Model, fields


class SaleOrder(Model):
    _inherit = "sale.order"

    mondialrelay_point_id = fields.Char(string="Mondial Relay Point", default="")
