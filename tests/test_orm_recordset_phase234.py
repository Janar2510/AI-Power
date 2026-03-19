"""Phase 234: ORM Recordset operations - mapped, filtered, filtered_domain, grouped, concat, union, etc."""

import unittest
from pathlib import Path

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.orm.models import Recordset
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


def _setup_env(db: str, addons_path: str, cr):
    parse_config(["--addons-path=" + addons_path])
    registry = Registry(db)
    from core.orm.models import ModelBase
    ModelBase._registry = registry
    clear_loaded_addon_modules()
    load_module_graph()
    init_schema(cr, registry)
    env = Environment(registry, cr=cr, uid=1)
    registry.set_env(env)
    load_default_data(env)
    return env


class TestOrmRecordsetPhase234(unittest.TestCase):
    """Test Recordset: filtered_domain, grouped, concat, union, toggle_active, export_data, name_create."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_orm_recordset_234"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_filtered_domain(self):
        """filtered_domain filters by domain."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_orm_recordset_234")
        with get_cursor(self.db) as cr:
            env = _setup_env(self.db, self._addons_path, cr)
            Partner = env.get("res.partner")
            if not Partner:
                self.skipTest("res.partner not found")
            all_recs = Partner.search([], limit=5)
            if not all_recs.ids:
                p = Partner.create({"name": "FilterDomain A"})
                all_recs = Partner.browse([p.id])
            filtered = all_recs.filtered_domain([("name", "ilike", "FilterDomain")])
            self.assertIsInstance(filtered, Recordset)
            self.assertLessEqual(len(filtered.ids), len(all_recs.ids))

    def test_grouped(self):
        """grouped returns dict of value -> Recordset."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_orm_recordset_234")
        with get_cursor(self.db) as cr:
            env = _setup_env(self.db, self._addons_path, cr)
            Partner = env.get("res.partner")
            if not Partner:
                self.skipTest("res.partner not found")
            recs = Partner.search([], limit=3)
            if not recs.ids:
                self.skipTest("No partners")
            groups = recs.grouped("name")
            self.assertIsInstance(groups, dict)
            for k, v in groups.items():
                self.assertIsInstance(v, Recordset)
                self.assertEqual(v._model, Partner)

    def test_concat_union(self):
        """concat and union combine recordsets."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_orm_recordset_234")
        with get_cursor(self.db) as cr:
            env = _setup_env(self.db, self._addons_path, cr)
            Partner = env.get("res.partner")
            if not Partner:
                self.skipTest("res.partner not found")
            r1 = Partner.search([], limit=1)
            r2 = Partner.search([], limit=2, offset=1)
            if not r1.ids and not r2.ids:
                p = Partner.create({"name": "ConcatTest"})
                r1 = Partner.browse([p.id])
                r2 = Recordset(Partner, [])
            concat = r1.concat(r2)
            self.assertIsInstance(concat, Recordset)
            self.assertEqual(len(concat.ids), len(r1.ids) + len(r2.ids))
            union = r1.union(r2)
            self.assertEqual(len(union.ids), len(set(union.ids)))

    def test_export_data(self):
        """export_data returns list of rows."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_orm_recordset_234")
        with get_cursor(self.db) as cr:
            env = _setup_env(self.db, self._addons_path, cr)
            Partner = env.get("res.partner")
            if not Partner:
                self.skipTest("res.partner not found")
            recs = Partner.search([], limit=2)
            rows = recs.export_data(["id", "name"])
            self.assertIsInstance(rows, list)
            for row in rows:
                self.assertIsInstance(row, list)
                self.assertEqual(len(row), 2)

    def test_name_create(self):
        """name_create creates record and returns (id, display_name)."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_orm_recordset_234")
        with get_cursor(self.db) as cr:
            env = _setup_env(self.db, self._addons_path, cr)
            Partner = env.get("res.partner")
            if not Partner:
                self.skipTest("res.partner not found")
            rid, display = Partner.name_create("NameCreatePhase234", env=env)
            self.assertIsInstance(rid, int)
            self.assertIsInstance(display, str)
            self.assertIn("NameCreatePhase234", display)
