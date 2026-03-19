"""POS Stripe config fields (phase 344)."""

from core.orm import Model, fields


class PosConfig(Model):
    _inherit = "pos.config"

    stripe_terminal_location = fields.Char(string="Stripe Terminal Location")
