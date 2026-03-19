"""Gelato configuration model (phase 328)."""

from core.orm import Model, fields


class SaleGelatoConfig(Model):
    _name = "sale.gelato.config"
    _description = "Sale Gelato Config"

    api_key = fields.Char(string="API Key", default="")
    store_id = fields.Char(string="Store ID", default="")
