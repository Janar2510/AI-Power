"""Phase 195: Reconciliation Wizard."""

import unittest

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


def _ensure_test_db(dbname: str) -> bool:
    from pathlib import Path
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestReconcileWizardPhase195(unittest.TestCase):
    """Test account.reconcile.wizard and batch reconcile."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_wizard_creates_lines_with_suggestions(self):
        """Wizard creates lines with suggested move_line_id from amount+partner match."""
        if not self._has_db:
            self.skipTest("DB not found")
        parse_config(["--addons-path=" + self._addons_path])
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Statement = env.get("account.bank.statement")
            StmtLine = env.get("account.bank.statement.line")
            Journal = env.get("account.journal")
            Move = env.get("account.move")
            MoveLine = env.get("account.move.line")
            Account = env.get("account.account")
            Partner = env.get("res.partner")
            Wizard = env.get("account.reconcile.wizard")
            WizardLine = env.get("account.reconcile.wizard.line")
            if not all([Statement, StmtLine, Journal, Move, MoveLine, Account, Wizard, WizardLine]):
                self.skipTest("Models not loaded")
            bank_journal = Journal.search([("type", "=", "bank")], limit=1)
            if not bank_journal.ids:
                bank_journal = Journal.search([], limit=1)
            bank_account = Account.search([("account_type", "=", "asset_cash")], limit=1)
            if not bank_account.ids or not bank_journal.ids:
                self.skipTest("No bank journal/account")
            partner = Partner.create({"name": "Test Reconcile Partner Phase195"})
            partner_id = partner.ids[0]
            move = Move.create({
                "name": "BANK/TEST",
                "journal_id": bank_journal.ids[0],
                "move_type": "entry",
                "date": "2025-03-14",
                "state": "draft",
            })
            amt = 9127.53
            MoveLine.create({
                "move_id": move.ids[0],
                "account_id": bank_account.ids[0],
                "name": "Bank deposit",
                "debit": amt,
                "credit": 0.0,
                "partner_id": partner_id,
            })
            MoveLine.create({
                "move_id": move.ids[0],
                "account_id": Account.search([("account_type", "=", "income")], limit=1).ids[0],
                "name": "Revenue",
                "debit": 0.0,
                "credit": amt,
                "partner_id": partner_id,
            })
            st = Statement.create({
                "journal_id": bank_journal.ids[0],
                "date": "2025-03-15",
                "balance_start": 0.0,
            })
            line = StmtLine.create({
                "statement_id": st.ids[0],
                "name": "Deposit",
                "date": "2025-03-14",
                "amount": amt,
                "partner_id": partner_id,
            })
            wiz = Wizard.create({"statement_line_ids": [line.ids[0]]})
            self.assertTrue(wiz.ids)
            lines = WizardLine.search([("wizard_id", "=", wiz.ids[0])])
            self.assertEqual(len(lines.ids), 1)
            row = lines.read(["statement_line_id", "move_line_id"])[0]
            stmt_val = row.get("statement_line_id")
            stmt_id = stmt_val[0] if isinstance(stmt_val, (list, tuple)) and stmt_val else stmt_val
            self.assertEqual(stmt_id, line.ids[0])
            mid = row.get("move_line_id")
            move_line_id = mid[0] if isinstance(mid, (list, tuple)) and mid else mid
            bank_ml = MoveLine.search([("move_id", "=", move.ids[0]), ("debit", "=", amt)], limit=1)
            self.assertTrue(move_line_id, "Wizard should suggest a matching move line")
            self.assertEqual(move_line_id, bank_ml.ids[0] if bank_ml.ids else None, "Suggested move line should be from our move")

    def test_action_reconcile_links_and_marks(self):
        """action_reconcile links statement line to move and sets reconciled_id on move line."""
        if not self._has_db:
            self.skipTest("DB not found")
        parse_config(["--addons-path=" + self._addons_path])
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Statement = env.get("account.bank.statement")
            StmtLine = env.get("account.bank.statement.line")
            Journal = env.get("account.journal")
            Move = env.get("account.move")
            MoveLine = env.get("account.move.line")
            Account = env.get("account.account")
            Partner = env.get("res.partner")
            Wizard = env.get("account.reconcile.wizard")
            WizardLine = env.get("account.reconcile.wizard.line")
            if not all([Statement, StmtLine, Journal, Move, MoveLine, Account, Wizard, WizardLine]):
                self.skipTest("Models not loaded")
            bank_journal = Journal.search([("type", "=", "bank")], limit=1)
            if not bank_journal.ids:
                bank_journal = Journal.search([], limit=1)
            bank_account = Account.search([("account_type", "=", "asset_cash")], limit=1)
            if not bank_account.ids or not bank_journal.ids:
                self.skipTest("No bank journal/account")
            partner = Partner.create({"name": "Test Reconcile Partner Phase195b"})
            partner_id = partner.ids[0]
            move = Move.create({
                "name": "BANK/TEST2",
                "journal_id": bank_journal.ids[0],
                "move_type": "entry",
                "date": "2025-03-14",
                "state": "draft",
            })
            amt = 7934.12
            ml = MoveLine.create({
                "move_id": move.ids[0],
                "account_id": bank_account.ids[0],
                "name": "Bank deposit",
                "debit": amt,
                "credit": 0.0,
                "partner_id": partner_id,
            })
            MoveLine.create({
                "move_id": move.ids[0],
                "account_id": Account.search([("account_type", "=", "income")], limit=1).ids[0],
                "name": "Revenue",
                "debit": 0.0,
                "credit": amt,
                "partner_id": partner_id,
            })
            st = Statement.create({
                "journal_id": bank_journal.ids[0],
                "date": "2025-03-15",
                "balance_start": 0.0,
            })
            stmt_line = StmtLine.create({
                "statement_id": st.ids[0],
                "name": "Deposit",
                "date": "2025-03-14",
                "amount": amt,
                "partner_id": partner_id,
            })
            wiz = Wizard.create({"statement_line_ids": [stmt_line.ids[0]]})
            wiz_lines = WizardLine.search([("wizard_id", "=", wiz.ids[0])])
            self.assertEqual(len(wiz_lines.ids), 1)
            wiz_line = WizardLine.browse(wiz_lines.ids[0])
            wiz_line.write({"move_line_id": ml.ids[0]})
            wiz.action_reconcile()
            row = StmtLine.browse(stmt_line.ids[0]).read(["move_id"])[0]
            mid = row.get("move_id")
            mid = mid[0] if isinstance(mid, (list, tuple)) and mid else mid
            self.assertEqual(mid, move.ids[0])
            ml_row = MoveLine.browse(ml.ids[0]).read(["reconciled_id"])[0]
            self.assertTrue(ml_row.get("reconciled_id"))
