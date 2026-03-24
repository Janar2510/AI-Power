"""Phase 564: ir.sequence.company_id + next_by_code(code, company_id=…) (DB optional)."""

import unittest

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.orm.models import ModelBase
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


class TestIrSequenceCompanyPhase564(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = db_exists(cls.db)

    def test_company_specific_sequence_used_for_account_move(self):
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

            Seq = env.get("ir.sequence")
            Company = env.get("res.company")
            if not Seq or not Company:
                self.skipTest("missing models")

            companies = Company.search([], limit=2)
            if len(companies.ids) < 2:
                self.skipTest("need two res.company rows")

            c1, c2 = companies.ids[0], companies.ids[1]
            existing = Seq.search([("code", "=", "account.move.test564")])
            if existing.ids:
                existing.unlink()
            Seq.create(
                {
                    "code": "account.move.test564",
                    "name": "T564 A",
                    "number_next": 10,
                    "company_id": c1,
                }
            )
            Seq.create(
                {
                    "code": "account.move.test564",
                    "name": "T564 B",
                    "number_next": 200,
                    "company_id": c2,
                }
            )

            n1 = Seq.next_by_code("account.move.test564", company_id=c1)
            n2 = Seq.next_by_code("account.move.test564", company_id=c2)
            self.assertEqual(n1, 11)
            self.assertEqual(n2, 201)

            cleanup = Seq.search([("code", "=", "account.move.test564")])
            if cleanup.ids:
                cleanup.unlink()
