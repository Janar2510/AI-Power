"""Peppol advanced fields on account moves (phase 321)."""

from core.orm import Model, fields


class AccountMove(Model):
    _inherit = "account.move"

    peppol_message_uuid = fields.Char(string="Peppol Message UUID", default="")
    peppol_move_state = fields.Selection(
        selection=[("none", "None"), ("queued", "Queued"), ("sent", "Sent"), ("error", "Error")],
        string="Peppol State",
        default="none",
    )
