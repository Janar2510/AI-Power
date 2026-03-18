"""Reconciliation wizard (Phase 195)."""

import uuid
from core.orm import TransientModel, fields


class AccountReconcileWizard(TransientModel):
    _name = "account.reconcile.wizard"
    _description = "Reconcile Bank Statement Lines"

    statement_line_ids = fields.Many2many(
        "account.bank.statement.line",
        relation="account_reconcile_wizard_statement_line_rel",
        column1="wizard_id",
        column2="statement_line_id",
        string="Statement Lines",
    )
    line_ids = fields.One2many(
        "account.reconcile.wizard.line",
        "wizard_id",
        string="Reconciliation Lines",
    )

    @classmethod
    def default_get(cls, field_names, context=None):
        """Pre-fill statement lines from context default_statement_line_ids or active_id."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        ctx = context or {}
        result = {}
        if "statement_line_ids" in (field_names or []):
            line_ids = ctx.get("default_statement_line_ids") or ctx.get("active_ids") or []
            if not line_ids and ctx.get("active_model") == "account.bank.statement" and ctx.get("active_id"):
                StmtLine = env.get("account.bank.statement.line") if env else None
                if StmtLine:
                    lines = StmtLine.search([("statement_id", "=", ctx["active_id"]), ("move_id", "=", False)])
                    line_ids = lines.ids
            result["statement_line_ids"] = line_ids
        return result

    def _prepare_wizard_lines(self):
        """Build wizard lines from statement lines with suggested move lines."""
        if not self or not self.ids:
            return
        env = getattr(self, "env", None)
        StmtLine = env.get("account.bank.statement.line") if env else None
        MoveLine = env.get("account.move.line") if env else None
        Account = env.get("account.account") if env else None
        WizardLine = env.get("account.reconcile.wizard.line") if env else None
        if not all([StmtLine, MoveLine, Account, WizardLine]):
            return
        bank_accounts = Account.search([("account_type", "=", "asset_cash")])
        bank_ids = bank_accounts.ids if bank_accounts else []
        if not bank_ids:
            return
        for wiz in self:
            stmt_line_ids = wiz.statement_line_ids.ids if wiz.statement_line_ids else []
            if not stmt_line_ids:
                continue
            lines_data = []
            for stmt_line in StmtLine.browse(stmt_line_ids):
                row = stmt_line.read(["amount", "partner_id"])[0]
                amount = float(row.get("amount") or 0)
                partner_id = row.get("partner_id")
                if isinstance(partner_id, (list, tuple)) and partner_id:
                    partner_id = partner_id[0]
                domain = [("account_id", "in", bank_ids), ("reconciled_id", "=", False)]
                if partner_id:
                    domain.append(("partner_id", "=", partner_id))
                candidates = MoveLine.search(domain)
                suggested_id = None
                for line in candidates:
                    lrow = line.read(["debit", "credit"])[0]
                    bal = (lrow.get("debit") or 0) - (lrow.get("credit") or 0)
                    if abs(bal - amount) < 0.01:
                        suggested_id = line.ids[0]
                        break
                lines_data.append({
                    "wizard_id": wiz.ids[0],
                    "statement_line_id": stmt_line.ids[0],
                    "move_line_id": suggested_id,
                })
            for line_vals in lines_data:
                WizardLine.create(line_vals)

    @classmethod
    def create(cls, vals_list):
        records = super().create(vals_list)
        for rec in records:
            rec._prepare_wizard_lines()
        return records

    def action_reconcile(self):
        """Reconcile selected statement lines with move lines."""
        if not self or not self.ids:
            return None
        env = getattr(self, "env", None)
        StmtLine = env.get("account.bank.statement.line") if env else None
        if not StmtLine:
            return None
        recon_id = str(uuid.uuid4())
        for wiz in self:
            line_ids = wiz.line_ids.ids if wiz.line_ids else []
            if not line_ids:
                continue
            WizardLine = env.get("account.reconcile.wizard.line") if env else None
            if not WizardLine:
                continue
            for line in WizardLine.browse(line_ids):
                row = line.read(["statement_line_id", "move_line_id"])[0]
                stmt_val = row.get("statement_line_id")
                stmt_line_id = stmt_val[0] if isinstance(stmt_val, (list, tuple)) and stmt_val else stmt_val
                move_val = row.get("move_line_id")
                move_line_id = move_val[0] if isinstance(move_val, (list, tuple)) and move_val else move_val
                if not stmt_line_id or not move_line_id:
                    continue
                MoveLine = env.get("account.move.line") if env else None
                if not MoveLine:
                    continue
                ml_row = MoveLine.browse(move_line_id).read(["move_id"])[0]
                move_id = ml_row.get("move_id")
                move_id = move_id[0] if isinstance(move_id, (list, tuple)) and move_id else move_id
                if not move_id:
                    continue
                StmtLine.browse(stmt_line_id).write({"move_id": move_id})
                MoveLine.browse(move_line_id).write({"reconciled_id": recon_id})
        self.unlink()
        return None

    def action_open_wizard(self):
        """Called from statement: create wizard, return action to open it."""
        if not self or not self.ids:
            return None
        return {
            "type": "ir.actions.act_window",
            "res_model": "account.reconcile.wizard",
            "res_id": self.ids[0],
            "view_mode": "form",
            "target": "current",
        }


class AccountReconcileWizardLine(TransientModel):
    _name = "account.reconcile.wizard.line"
    _description = "Reconciliation Wizard Line"

    wizard_id = fields.Many2one(
        "account.reconcile.wizard",
        string="Wizard",
        required=True,
        ondelete="cascade",
    )
    statement_line_id = fields.Many2one(
        "account.bank.statement.line",
        string="Statement Line",
        required=True,
    )
    move_line_id = fields.Many2one(
        "account.move.line",
        string="Journal Item",
    )
