"""Phase 127: Recordset utility methods (mapped, filtered, sorted, exists, ensure_one)."""

import unittest

from core.tools.config import parse_config
from core.modules import load_module_graph, clear_loaded_addon_modules
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


def _ensure_test_db(dbname: str) -> bool:
    parse_config(["--addons-path=addons"])
    return db_exists(dbname)


class TestRecordsetPhase127(unittest.TestCase):
    """Phase 127: mapped, filtered, sorted, exists, ensure_one."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)

    def test_recordset_mapped_field(self):
        """mapped('name') returns list of values."""
        if not self._has_db:
            self.skipTest("DB not found")
        clear_loaded_addon_modules()
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Partner = env.get("res.partner")
            if not Partner:
                self.skipTest("res.partner not loaded")
            recs = Partner.search([], limit=3)
            names = recs.mapped("name")
            self.assertIsInstance(names, list)
            self.assertEqual(len(names), min(3, len(recs)))
            self.assertTrue(all(isinstance(n, str) or n is None for n in names))

    def test_recordset_mapped_many2one(self):
        """mapped('partner_id') on crm.lead returns res.partner recordset."""
        if not self._has_db:
            self.skipTest("DB not found")
        clear_loaded_addon_modules()
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Lead = env.get("crm.lead")
            Partner = env.get("res.partner")
            if not Lead or not Partner:
                self.skipTest("crm.lead or res.partner not loaded")
            recs = Lead.search([], limit=5)
            partners = recs.mapped("partner_id")
            self.assertIsNotNone(partners)
            self.assertTrue(hasattr(partners, "_ids"))
            self.assertTrue(hasattr(partners, "_model"))
            self.assertEqual(partners._model._name, "res.partner")

    def test_recordset_filtered(self):
        """filtered(callable) returns matching records."""
        if not self._has_db:
            self.skipTest("DB not found")
        clear_loaded_addon_modules()
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Partner = env.get("res.partner")
            if not Partner:
                self.skipTest("res.partner not loaded")
            recs = Partner.search([], limit=10)
            filtered = recs.filtered(lambda r: r.read(["name"])[0].get("name", "").startswith("A"))
            self.assertIsInstance(filtered._ids, list)
            self.assertLessEqual(len(filtered), len(recs))

    def test_recordset_sorted(self):
        """sorted(key) returns ordered recordset."""
        if not self._has_db:
            self.skipTest("DB not found")
        clear_loaded_addon_modules()
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Partner = env.get("res.partner")
            if not Partner:
                self.skipTest("res.partner not loaded")
            recs = Partner.search([], limit=5)
            sorted_recs = recs.sorted(key="name")
            self.assertEqual(len(sorted_recs), len(recs))
            self.assertEqual(set(sorted_recs._ids), set(recs._ids))

    def test_recordset_exists(self):
        """exists() returns recordset of records still in DB."""
        if not self._has_db:
            self.skipTest("DB not found")
        clear_loaded_addon_modules()
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Partner = env.get("res.partner")
            if not Partner:
                self.skipTest("res.partner not loaded")
            recs = Partner.search([], limit=2)
            existing = recs.exists()
            self.assertEqual(len(existing), len(recs))
            fake = Partner.browse([999999])
            self.assertEqual(len(fake.exists()), 0)

    def test_recordset_ensure_one(self):
        """ensure_one() returns single record; raises on empty or multiple."""
        if not self._has_db:
            self.skipTest("DB not found")
        clear_loaded_addon_modules()
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Partner = env.get("res.partner")
            if not Partner:
                self.skipTest("res.partner not loaded")
            recs = Partner.search([], limit=1)
            one = recs.ensure_one()
            self.assertTrue(hasattr(one, "id"))
            empty = Partner.browse([])
            with self.assertRaises(ValueError):
                empty.ensure_one()
            multi = Partner.search([], limit=2)
            if len(multi) > 1:
                with self.assertRaises(ValueError):
                    multi.ensure_one()
