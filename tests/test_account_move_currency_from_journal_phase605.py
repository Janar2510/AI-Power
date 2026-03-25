"""Phase 605: account.move.currency_id defaults from account.journal.currency_id on create (DB optional)."""

import unittest
import uuid

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.orm.models import ModelBase
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


class TestAccountMoveCurrencyFromJournalPhase605(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = db_exists(cls.db)

    def test_move_currency_defaults_from_journal(self):
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
            Journal = env.get("account.journal")
            Currency = env.get("res.currency")
            Company = env.get("res.company")
            if not all([Move, Journal, Currency, Company]):
                self.skipTest("models missing")

            companies = Company.search([], limit=1)
            if not companies.ids:
                self.skipTest("no company")
            cid = companies.ids[0]
            cur_rows = Currency.search_read([[]], ["id"], limit=1)
            if not cur_rows:
                self.skipTest("no currency")
            cur_id = cur_rows[0]["id"]

            code = "M" + uuid.uuid4().hex[:4]
            jid = Journal.create(
                {
                    "name": "Phase 605 currency journal",
                    "code": code,
                    "type": "general",
                    "company_id": cid,
                    "currency_id": cur_id,
                }
            )
            mid = Move.create(
                {
                    "journal_id": jid.ids[0],
                    "move_type": "entry",
                    "state": "draft",
                    "date": "2025-02-01",
                }
            )
            row = Move.browse(mid.ids[0]).read(["currency_id"])[0]
            cval = row.get("currency_id")
            got = cval[0] if isinstance(cval, (list, tuple)) and cval else cval
            self.assertEqual(got, cur_id)
