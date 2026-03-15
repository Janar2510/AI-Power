"""Journal entry / Invoice (Phase 118)."""

from core.orm import Model, fields


class AccountMove(Model):
    _name = "account.move"
    _description = "Journal Entry"

    name = fields.Char(string="Number", required=True, default="New")
    journal_id = fields.Many2one("account.journal", string="Journal", required=True)
    partner_id = fields.Many2one("res.partner", string="Partner")
    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("posted", "Posted"),
            ("paid", "Paid"),
            ("cancel", "Cancelled"),
        ],
        string="Status",
        default="draft",
    )
    move_type = fields.Selection(
        selection=[
            ("out_invoice", "Customer Invoice"),
            ("in_invoice", "Vendor Bill"),
            ("entry", "Journal Entry"),
        ],
        string="Type",
        default="entry",
    )
    invoice_origin = fields.Char(string="Source")

    line_ids = fields.One2many(
        "account.move.line",
        "move_id",
        string="Journal Items",
    )

    def action_post(self):
        """Post the move: draft -> posted."""
        self.write({"state": "posted"})

    def action_cancel(self):
        """Cancel the move."""
        self.write({"state": "cancel"})
