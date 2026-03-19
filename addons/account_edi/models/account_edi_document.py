"""Account EDI document model (phase 320)."""

from core.orm import Model, fields


class AccountEdiDocument(Model):
    _name = "account.edi.document"
    _description = "Account EDI Document"

    move_id = fields.Many2one("account.move", string="Move", ondelete="cascade")
    edi_format_id = fields.Many2one("account.edi.format", string="EDI Format", ondelete="set null")
    state = fields.Selection(
        selection=[("draft", "Draft"), ("to_send", "To Send"), ("sent", "Sent"), ("error", "Error")],
        string="State",
        default="draft",
    )
    error = fields.Text(string="Error")
    attachment_id = fields.Many2one("ir.attachment", string="Attachment", ondelete="set null")
