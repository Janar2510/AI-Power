"""Phase 611: account_lock_adviser_group_id lets members post on/before lock date (DB optional)."""

import unittest

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.orm.models import ModelBase
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


class TestAccountLockAdviserPhase611(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = db_exists(cls.db)

    def test_adviser_group_bypasses_account_lock_date(self):
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
            Groups = env.get("res.groups")
            User = env.get("res.users")
            if not all([Move, MoveLine, Journal, Account, Company, Groups, User]):
                self.skipTest("models missing")

            companies = Company.search([], limit=1)
            if not companies.ids:
                self.skipTest("no company")
            cid = companies.ids[0]

            g = Groups.create(
                {
                    "name": "Account lock adviser (phase 611)",
                    "full_name": "test.account_lock_adviser_phase611",
                }
            )
            if not g or not g.ids:
                self.skipTest("could not create group")
            gid = g.ids[0]

            u1 = User.browse(1)
            if not u1.ids:
                self.skipTest("no admin user")
            urow = u1.read(["group_ids"])[0]
            raw_g = urow.get("group_ids") or []
            existing = [x[0] if isinstance(x, (list, tuple)) and x else x for x in raw_g]
            merged = list(dict.fromkeys(existing + [gid]))
            u1.write({"group_ids": [(6, 0, merged)]})

            Company.browse(cid).write(
                {
                    "account_lock_date": "2024-06-30",
                    "account_lock_adviser_group_id": gid,
                }
            )

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
                    "credit": 7.0,
                }
            )
            MoveLine.create(
                {
                    "move_id": move.ids[0],
                    "account_id": receivable.ids[0],
                    "name": "Recv",
                    "debit": 7.0,
                    "credit": 0.0,
                }
            )
            Move.browse(move.ids[0]).action_post()
            st = Move.browse(move.ids[0]).read(["state"])[0].get("state")
            self.assertEqual(st, "posted")
