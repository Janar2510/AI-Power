"""Account move EDI links (phase 320)."""

from core.orm import Model, fields


class AccountMove(Model):
    _inherit = "account.move"

    edi_document_ids = fields.One2many("account.edi.document", "move_id", string="EDI Documents")
