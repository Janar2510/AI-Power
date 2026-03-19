"""Phase 254: search_fetch combined method."""

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


class TestSearchFetchPhase254(unittest.TestCase):
    """Test search_fetch method."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_search_fetch_254"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_search_fetch_returns_recordset(self):
        """search_fetch returns Recordset like search()."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_search_fetch_254")
        with get_cursor(self.db) as cr:
            parse_config(["--addons-path=" + self._addons_path])
            registry = Registry(self.db)
            from core.orm.models import ModelBase
            ModelBase._registry = registry
            clear_loaded_addon_modules()
            load_module_graph()
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Partner = env.get("res.partner")
            if not Partner:
                self.skipTest("res.partner not found")
            recs = Partner.search_fetch([], field_names=["name"], limit=3)
            self.assertIsNotNone(recs)
            self.assertTrue(hasattr(recs, "_ids"))
            self.assertTrue(hasattr(recs, "_model"))

    def test_search_fetch_equiv_to_search_read(self):
        """search_fetch(domain, fields) equivalent to search+read."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_search_fetch_254")
        with get_cursor(self.db) as cr:
            parse_config(["--addons-path=" + self._addons_path])
            registry = Registry(self.db)
            from core.orm.models import ModelBase
            ModelBase._registry = registry
            clear_loaded_addon_modules()
            load_module_graph()
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Partner = env.get("res.partner")
            if not Partner:
                self.skipTest("res.partner not found")
            recs_sf = Partner.search_fetch([], field_names=["name", "id"], limit=5)
            recs_sr = Partner.search_read([], fields=["name", "id"], limit=5)
            self.assertEqual(len(recs_sf.ids), len(recs_sr))
            for i, row in enumerate(recs_sr):
                if i < len(recs_sf.ids):
                    self.assertEqual(recs_sf.ids[i], row.get("id"))
