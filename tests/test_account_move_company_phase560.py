"""Phase 560: account.move.company_id defaults from journal; lock date uses move's company (DB optional)."""

import unittest

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.orm.models import ModelBase
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


class TestAccountMoveCompanyPhase560(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = db_exists(cls.db)

    def test_move_company_id_defaults_from_journal(self):
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
            cid = companies.ids[0]

            journal = Journal.search([("type", "=", "sale")], limit=1)
            income = Account.search([("account_type", "=", "income")], limit=1)
            receivable = Account.search([("account_type", "=", "asset_receivable")], limit=1)
            if not all([journal.ids, income.ids, receivable.ids]):
                self.skipTest("Need journal and accounts")

            Journal.browse(journal.ids[0]).write({"company_id": cid})
            move = Move.create(
                {
                    "journal_id": journal.ids[0],
                    "move_type": "out_invoice",
                    "state": "draft",
                    "date": "2025-01-15",
                }
            )
            crow = Move.browse(move.ids[0]).read(["company_id"])[0]
            cval = crow.get("company_id")
            got = cval[0] if isinstance(cval, (list, tuple)) and cval else cval
            self.assertEqual(got, cid)

    def test_lock_date_uses_move_company_not_first_company(self):
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
            Currency = env.get("res.currency")
            ResCompany = env.get("res.company")
            if not all([Move, MoveLine, Journal, Account, ResCompany]):
                self.skipTest("models missing")

            first = ResCompany.search([], limit=1)
            if not first.ids:
                self.skipTest("no company")
            eur = Currency.search([("name", "=", "EUR")], limit=1)
            cur_id = eur.ids[0] if eur.ids else None
            vals_b = {"name": "Phase560 Co B"}
            if cur_id:
                vals_b["currency_id"] = cur_id
            co_b = ResCompany.create(vals_b)
            bid = co_b.ids[0] if co_b.ids else None
            if not bid:
                self.skipTest("could not create second company")

            # First company: strict lock — would block July move if we wrongly used it.
            ResCompany.browse(first.ids[0]).write({"account_lock_date": "2025-12-31"})
            # Second company: earlier lock only through June — July is open for B.
            ResCompany.browse(bid).write({"account_lock_date": "2024-06-30"})

            journal = Journal.search([("type", "=", "sale")], limit=1)
            income = Account.search([("account_type", "=", "income")], limit=1)
            receivable = Account.search([("account_type", "=", "asset_receivable")], limit=1)
            if not all([journal.ids, income.ids, receivable.ids]):
                self.skipTest("Need journal and accounts")

            Journal.browse(journal.ids[0]).write({"company_id": bid})

            move = Move.create(
                {
                    "journal_id": journal.ids[0],
                    "company_id": bid,
                    "move_type": "out_invoice",
                    "state": "draft",
                    "date": "2025-07-01",
                }
            )
            MoveLine.create(
                {
                    "move_id": move.ids[0],
                    "account_id": income.ids[0],
                    "name": "Line",
                    "debit": 0.0,
                    "credit": 3.0,
                }
            )
            MoveLine.create(
                {
                    "move_id": move.ids[0],
                    "account_id": receivable.ids[0],
                    "name": "Recv",
                    "debit": 3.0,
                    "credit": 0.0,
                }
            )
            Move.browse(move.ids[0]).action_post()
            st = Move.browse(move.ids[0]).read(["state"])[0].get("state")
            self.assertEqual(st, "posted")
