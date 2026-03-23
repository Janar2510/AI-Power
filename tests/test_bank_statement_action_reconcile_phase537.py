"""Phase 537: bank statement action_reconcile returns wizard when lines are open."""

import unittest
from pathlib import Path

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestBankStatementActionReconcilePhase537(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_action_reconcile_returns_wizard_action(self):
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
            if not all([Statement, StmtLine, Journal]):
                self.skipTest("Models not loaded")
            bank_journal = Journal.search([("type", "=", "bank")], limit=1)
            if not bank_journal.ids:
                bank_journal = Journal.search([], limit=1)
            if not bank_journal.ids:
                self.skipTest("No journal")
            st = Statement.create({
                "journal_id": bank_journal.ids[0],
                "date": "2025-03-15",
                "balance_start": 0.0,
            })
            StmtLine.create({
                "statement_id": st.ids[0],
                "name": "Open line",
                "date": "2025-03-15",
                "amount": 42.0,
            })
            action = st.action_reconcile()
            self.assertIsInstance(action, dict)
            self.assertEqual(action.get("type"), "ir.actions.act_window")
            self.assertEqual(action.get("res_model"), "account.reconcile.wizard")
