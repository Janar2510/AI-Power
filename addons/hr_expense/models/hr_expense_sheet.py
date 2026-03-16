"""Expense sheet - approval workflow (Phase 161)."""

from core.orm import Model, api, fields


class HrExpenseSheet(Model):
    _name = "hr.expense.sheet"
    _description = "Expense Report"

    name = fields.Char(required=True, default="New")
    employee_id = fields.Many2one("hr.employee", string="Employee", required=True)
    expense_line_ids = fields.One2many(
        "hr.expense",
        "sheet_id",
        string="Expense Lines",
    )
    total_amount = fields.Computed(compute="_compute_total_amount", string="Total")
    state = fields.Selection(
        selection=[
            ("draft", "Draft"),
            ("submit", "Submitted"),
            ("approve", "Approved"),
            ("done", "Done"),
            ("cancel", "Cancelled"),
        ],
        default="draft",
    )
    journal_id = fields.Many2one("account.journal", string="Journal")
    account_move_id = fields.Many2one("account.move", string="Journal Entry", readonly=True)

    @api.depends("expense_line_ids.unit_amount", "expense_line_ids.quantity")
    def _compute_total_amount(self):
        if not self:
            return []
        result = []
        for rec in self:
            lines = rec.expense_line_ids
            if not lines:
                result.append(0.0)
                continue
            rows = lines.read(["unit_amount", "quantity"])
            total = sum(r.get("unit_amount", 0) * r.get("quantity", 1) for r in rows)
            result.append(total)
        return result

    @classmethod
    def create(cls, vals):
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if vals.get("name") == "New" or not vals.get("name"):
            IrSeq = env.get("ir.sequence") if env else None
            next_val = IrSeq.next_by_code("hr.expense.sheet") if IrSeq else None
            vals = dict(vals, name=f"EXP/{next_val:05d}" if next_val else "New")
        return super().create(vals)

    def action_submit(self):
        self.write({"state": "submit"})
        self.expense_line_ids.write({"state": "reported"})

    def action_approve(self):
        self.write({"state": "approve"})
        self.expense_line_ids.write({"state": "approved"})

    def action_done(self):
        """Create account.move for expenses."""
        for sheet in self:
            if sheet.state != "approve":
                continue
            env = getattr(sheet, "env", None)
            if not env:
                continue
            Move = env.get("account.move")
            Journal = env.get("account.journal")
            if not Move or not Journal:
                continue
            journals = Journal.search([("type", "=", "purchase")], limit=1)
            journal_id = journals.ids[0] if journals.ids else None
            if not journal_id:
                journals = Journal.search([], limit=1)
                journal_id = journals.ids[0] if journals.ids else None
            if not journal_id:
                continue
            lines = sheet.expense_line_ids
            if not lines or not lines.ids:
                sheet.write({"state": "done"})
                continue
            total = sum(
                r.get("unit_amount", 0) * r.get("quantity", 1)
                for r in lines.read(["unit_amount", "quantity"])
            )
            move_vals = {
                "journal_id": journal_id,
                "move_type": "entry",
            }
            move = Move.create(move_vals)
            MoveLine = env.get("account.move.line")
            Account = env.get("account.account")
            if MoveLine and Account:
                expense_accounts = Account.search([("code", "ilike", "6")], limit=1)
                payable_accounts = Account.search([("code", "ilike", "4")], limit=1)
                exp_acc = expense_accounts.ids[0] if expense_accounts.ids else None
                pay_acc = payable_accounts.ids[0] if payable_accounts.ids else None
                if exp_acc and pay_acc:
                    MoveLine.create({
                        "move_id": move.id,
                        "account_id": exp_acc,
                        "name": f"Expense {sheet.name}",
                        "debit": total,
                    })
                    MoveLine.create({
                        "move_id": move.id,
                        "account_id": pay_acc,
                        "name": f"Expense {sheet.name}",
                        "credit": total,
                    })
            move.action_post()
            sheet.write({"state": "done", "account_move_id": move.id})
        return True

    def action_cancel(self):
        self.write({"state": "cancel"})
