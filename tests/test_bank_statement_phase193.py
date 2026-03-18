"""Phase 193: Bank Statements & Reconciliation."""

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


class TestBankStatementPhase193(unittest.TestCase):
    """Test account.bank.statement, lines, and _auto_reconcile."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_bank_statement_create_with_lines(self):
        """Create bank statement with lines."""
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
            Line = env.get("account.bank.statement.line")
            Journal = env.get("account.journal")
            if not all([Statement, Line, Journal]):
                self.skipTest("Models not loaded")
            journal = Journal.search([("type", "=", "bank")], limit=1)
            if not journal.ids:
                journal = Journal.search([], limit=1)
            if not journal.ids:
                self.skipTest("No journal")
            st = Statement.create({
                "journal_id": journal.ids[0],
                "date": "2025-03-15",
                "balance_start": 1000.0,
            })
            self.assertTrue(st.ids)
            Line.create({
                "statement_id": st.ids[0],
                "name": "Deposit",
                "date": "2025-03-15",
                "amount": 500.0,
            })
            lines = Line.search([("statement_id", "=", st.ids[0])])
            self.assertEqual(len(lines.ids), 1)

    def test_auto_reconcile_links_move(self):
        """_auto_reconcile matches statement line to move line by amount + partner."""
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
            Line = env.get("account.bank.statement.line")
            Journal = env.get("account.journal")
            Move = env.get("account.move")
            MoveLine = env.get("account.move.line")
            Account = env.get("account.account")
            Partner = env.get("res.partner")
            if not all([Statement, Line, Journal, Move, MoveLine, Account, Partner]):
                self.skipTest("Models not loaded")
            bank_journal = Journal.search([("type", "=", "bank")], limit=1)
            if not bank_journal.ids:
                bank_journal = Journal.search([], limit=1)
            bank_account = Account.search([("account_type", "=", "asset_cash")], limit=1)
            if not bank_account.ids or not bank_journal.ids:
                self.skipTest("No bank journal/account")
            partner = Partner.search([], limit=1)
            partner_id = partner.ids[0] if partner.ids else None
            move = Move.create({
                "name": "BANK/TEST",
                "journal_id": bank_journal.ids[0],
                "move_type": "entry",
                "date": "2025-03-14",
                "state": "draft",
            })
            MoveLine.create({
                "move_id": move.ids[0],
                "account_id": bank_account.ids[0],
                "name": "Bank deposit",
                "debit": 300.0,
                "credit": 0.0,
                "partner_id": partner_id,
            })
            MoveLine.create({
                "move_id": move.ids[0],
                "account_id": Account.search([("account_type", "=", "income")], limit=1).ids[0],
                "name": "Revenue",
                "debit": 0.0,
                "credit": 300.0,
                "partner_id": partner_id,
            })
            st = Statement.create({
                "journal_id": bank_journal.ids[0],
                "date": "2025-03-15",
                "balance_start": 0.0,
            })
            line = Line.create({
                "statement_id": st.ids[0],
                "name": "Deposit 300",
                "date": "2025-03-14",
                "amount": 300.0,
                "partner_id": partner_id,
            })
            line._auto_reconcile()
            row = line.read(["move_id"])[0]
            mid = row.get("move_id")
            if isinstance(mid, (list, tuple)) and mid:
                mid = mid[0]
            self.assertEqual(mid, move.ids[0])
