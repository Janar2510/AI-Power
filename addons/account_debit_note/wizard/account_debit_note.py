"""Add Debit Note wizard."""

from core.orm import TransientModel, fields


class AccountDebitNote(TransientModel):
    _name = "account.debit.note"
    _description = "Add Debit Note wizard"

    move_ids = fields.Many2many(
        "account.move",
        "account_move_debit_move_rel",
        "debit_id",
        "move_id",
        string="Moves",
    )
    date = fields.Date(string="Debit Note Date")
    reason = fields.Char(string="Reason")
    journal_id = fields.Many2one("account.journal", string="Journal")
    copy_lines = fields.Boolean(string="Copy Lines", default=False)

    def create_debit(self):
        """Create draft debit notes linked to selected moves."""
        self.ensure_one()
        Move = self.env.get("account.move")
        if not Move or not self.move_ids:
            return {"type": "ir.actions.act_window_close"}
        created_ids = []
        for move in self.move_ids:
            row = move.read(["partner_id", "move_type", "currency_id", "journal_id", "name"])[0]
            partner_id = row.get("partner_id")
            if isinstance(partner_id, (list, tuple)) and partner_id:
                partner_id = partner_id[0]
            journal_id = self.journal_id.id if self.journal_id else row.get("journal_id")
            if isinstance(journal_id, (list, tuple)) and journal_id:
                journal_id = journal_id[0]
            vals = {
                "name": "New",
                "partner_id": partner_id,
                "move_type": row.get("move_type") or "out_invoice",
                "currency_id": row.get("currency_id"),
                "journal_id": journal_id,
                "state": "draft",
                "invoice_origin": row.get("name") or "",
                "debit_origin_id": move.id,
            }
            created = Move.create(vals)
            if created and created.ids:
                created_ids.extend(created.ids)
        return {
            "type": "ir.actions.act_window",
            "name": "Debit Notes",
            "res_model": "account.move",
            "view_mode": "list,form",
            "domain": [("id", "in", created_ids)],
        }
