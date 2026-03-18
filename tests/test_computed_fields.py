"""Phase 210: Tests for computed fields (stored and non-stored)."""

import unittest
from pathlib import Path

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from core.orm.models import ModelBase


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestComputedFields(unittest.TestCase):
    """Test computed field computation on read and write."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_non_stored_computed_on_read(self):
        """Non-stored computed fields are computed on read."""
        if not self._has_db:
            self.skipTest("DB not found")
        parse_config(["--addons-path=" + self._addons_path])
        registry = Registry(self.db)
        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            SaleOrder = env.get("sale.order")
            if not SaleOrder:
                self.skipTest("sale.order model not available")
            recs = SaleOrder.search([], limit=1)
            if not recs or not recs.ids:
                self.skipTest("No sale orders in DB")
            rows = recs.read(["id", "amount_total", "order_line"])
            self.assertGreater(len(rows), 0)
            self.assertIn("amount_total", rows[0])

    def test_stored_computed_on_create(self):
        """Stored computed fields are computed and stored on create."""
        if not self._has_db:
            self.skipTest("DB not found")
        parse_config(["--addons-path=" + self._addons_path])
        registry = Registry(self.db)
        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            ResPartner = env.get("res.partner")
            if not ResPartner:
                self.skipTest("res.partner not available")
            rec = ResPartner.create({"name": "ComputedPhase210Test"})
            self.assertIsNotNone(rec.id)
            rows = rec.read(["id", "name", "display_name"])
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0]["display_name"], "ComputedPhase210Test")

    def test_compute_method_name_or_callable(self):
        """Computed field accepts compute as method name (str) or callable."""
        from core.orm import fields
        f1 = fields.Computed(compute="_compute_x", store=False)
        self.assertEqual(f1.compute, "_compute_x")

        def _compute_x(rec):
            return 0
        f2 = fields.Computed(compute=_compute_x, store=False)
        self.assertTrue(callable(f2.compute))
