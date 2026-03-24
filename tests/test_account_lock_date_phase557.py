"""Phase 557: res.company.account_lock_date blocks account.move.action_post (DB optional)."""

import unittest

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.orm.models import ModelBase
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


class TestAccountLockDatePhase557(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = db_exists(cls.db)

    def test_post_blocked_on_or_before_lock_date(self):
        if not self._has_db:
            self.skipTest("DB not found")
        with get_cursor(self.db) as cr:
            registry = Registry(self.db)
            ModelBase._registry = registry
            clear_loaded_addon_modules()
            load_module_graph()
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)

            Move = env.get("account.move")
            MoveLine = env.get("account.move.line")
            Journal = env.get("account.journal")
            Account = env.get("account.account")
            Company = env.get("res.company")
            if not all([Move, MoveLine, Journal, Account, Company]):
                self.skipTest("models missing")

            companies = Company.search([], limit=1)
            if not companies.ids:
                self.skipTest("no company")
            Company.browse(companies.ids[0]).write({"account_lock_date": "2024-06-30"})

            journal = Journal.search([("type", "=", "sale")], limit=1)
            income = Account.search([("account_type", "=", "income")], limit=1)
            receivable = Account.search([("account_type", "=", "asset_receivable")], limit=1)
            if not all([journal.ids, income.ids, receivable.ids]):
                self.skipTest("Need journal and accounts")

            move = Move.create(
                {
                    "journal_id": journal.ids[0],
                    "move_type": "out_invoice",
                    "state": "draft",
                    "date": "2024-06-15",
                }
            )
            MoveLine.create(
                {
                    "move_id": move.ids[0],
                    "account_id": income.ids[0],
                    "name": "Line",
                    "debit": 0.0,
                    "credit": 10.0,
                }
            )
            MoveLine.create(
                {
                    "move_id": move.ids[0],
                    "account_id": receivable.ids[0],
                    "name": "Recv",
                    "debit": 10.0,
                    "credit": 0.0,
                }
            )
            with self.assertRaises(ValueError) as ctx:
                Move.browse(move.ids[0]).action_post()
            self.assertIn("lock date", str(ctx.exception).lower())

    def test_post_allowed_after_lock_date(self):
        if not self._has_db:
            self.skipTest("DB not found")
        with get_cursor(self.db) as cr:
            registry = Registry(self.db)
            ModelBase._registry = registry
            clear_loaded_addon_modules()
            load_module_graph()
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)

            Move = env.get("account.move")
            MoveLine = env.get("account.move.line")
            Journal = env.get("account.journal")
            Account = env.get("account.account")
            Company = env.get("res.company")
            if not all([Move, MoveLine, Journal, Account, Company]):
                self.skipTest("models missing")

            companies = Company.search([], limit=1)
            if not companies.ids:
                self.skipTest("no company")
            Company.browse(companies.ids[0]).write({"account_lock_date": "2024-06-30"})

            journal = Journal.search([("type", "=", "sale")], limit=1)
            income = Account.search([("account_type", "=", "income")], limit=1)
            receivable = Account.search([("account_type", "=", "asset_receivable")], limit=1)
            if not all([journal.ids, income.ids, receivable.ids]):
                self.skipTest("Need journal and accounts")

            move = Move.create(
                {
                    "journal_id": journal.ids[0],
                    "move_type": "out_invoice",
                    "state": "draft",
                    "date": "2024-07-01",
                }
            )
            MoveLine.create(
                {
                    "move_id": move.ids[0],
                    "account_id": income.ids[0],
                    "name": "Line",
                    "debit": 0.0,
                    "credit": 5.0,
                }
            )
            MoveLine.create(
                {
                    "move_id": move.ids[0],
                    "account_id": receivable.ids[0],
                    "name": "Recv",
                    "debit": 5.0,
                    "credit": 0.0,
                }
            )
            Move.browse(move.ids[0]).action_post()
            st = Move.browse(move.ids[0]).read(["state"])[0].get("state")
            self.assertEqual(st, "posted")
