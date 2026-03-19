"""Phase 251: Digest module - KPI email digests."""

import unittest
from pathlib import Path

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from core.upgrade.runner import run_upgrade


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestDigestPhase251(unittest.TestCase):
    """Phase 251: digest module loads, models exist, CRUD works."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_digest_251"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_digest_module_loads(self):
        """digest module provides digest.digest, digest.tip."""
        if not self._has_db:
            self.skipTest("DB not found")
        parse_config(["--addons-path=" + self._addons_path])
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            run_upgrade(cr, self.db, None)
            cr.connection.commit()
        with get_cursor(self.db) as cr:
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Digest = env.get("digest.digest")
            Tip = env.get("digest.tip")
            self.assertIsNotNone(Digest)
            self.assertIsNotNone(Tip)

    def test_digest_crud(self):
        """Create digest and digest tip."""
        if not self._has_db:
            self.skipTest("DB not found")
        parse_config(["--addons-path=" + self._addons_path])
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            run_upgrade(cr, self.db, None)
            cr.connection.commit()
        with get_cursor(self.db) as cr:
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Digest = env.get("digest.digest")
            Tip = env.get("digest.tip")
            if not Digest or not Tip:
                self.skipTest("Models not loaded")
            d = Digest.create({"name": "Weekly KPI", "periodicity": "weekly", "state": "activated"})
            t = Tip.create({"name": "Tip 1", "tip_description": "Use shortcuts for faster navigation."})
            self.assertIsNotNone(d.ids[0] if d.ids else d.id)
            self.assertIsNotNone(t.ids[0] if t.ids else t.id)
