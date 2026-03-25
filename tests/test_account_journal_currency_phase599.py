"""Phase 599: account.journal.currency_id defaults from res.company.currency_id on create (DB optional)."""

import unittest

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.orm.models import ModelBase
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


class TestAccountJournalCurrencyPhase599(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = db_exists(cls.db)

    def test_journal_currency_defaults_from_company(self):
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

            Journal = env.get("account.journal")
            Company = env.get("res.company")
            Currency = env.get("res.currency")
            if not all([Journal, Company, Currency]):
                self.skipTest("models missing")

            companies = Company.search([], limit=1)
            if not companies.ids:
                self.skipTest("no company")
            cid = companies.ids[0]
            crow = Company.browse(cid).read(["currency_id"])[0]
            cur = crow.get("currency_id")
            expected_cur = cur[0] if isinstance(cur, (list, tuple)) and cur else cur
            if not expected_cur:
                self.skipTest("company has no currency")

            jid = Journal.create(
                {
                    "name": "Phase 599 Test Journal",
                    "code": "T599",
                    "type": "general",
                    "company_id": cid,
                }
            )
            jrow = Journal.browse(jid.ids[0]).read(["currency_id"])[0]
            jcur = jrow.get("currency_id")
            got = jcur[0] if isinstance(jcur, (list, tuple)) and jcur else jcur
            self.assertEqual(got, expected_cur)
