"""POS Adyen config fields (phase 344)."""

from core.orm import Model, fields


class PosConfig(Model):
    _inherit = "pos.config"

    adyen_terminal_identifier = fields.Char(string="Adyen Terminal Identifier")
