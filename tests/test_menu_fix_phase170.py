"""Phase 170: Fix Navigation Menu + Auto-Upgrade on Login."""

import unittest

from core.tools.config import parse_config
from core.modules import load_module_graph
from core.orm import Registry, Environment
from core.orm.models import ModelBase
from core.db import init_schema
from core.db.init_data import load_default_data
from core.data.views_registry import load_views_registry, load_views_registry_from_db
from core.sql_db import get_cursor, db_exists


def _ensure_test_db(dbname: str) -> bool:
    parse_config(["--addons-path=addons"])
    return db_exists(dbname)


class TestMenuFixPhase170(unittest.TestCase):
    """Phase 170: menus are non-empty after login; auto-upgrade when DB stale."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)

    def test_load_views_registry_has_menus(self):
        """XML registry has non-empty menus (fallback when DB empty)."""
        reg = load_views_registry()
        self.assertIn("menus", reg)
        self.assertGreater(len(reg["menus"]), 0, "XML menus should be non-empty")

    def test_load_views_registry_from_db_menus_non_empty_after_upgrade(self):
        """After load_default_data, load_views_registry_from_db returns non-empty menus."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        registry = Registry(self.db)
        ModelBase._registry = registry
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            load_default_data(Environment(registry, cr=cr, uid=1))
            cr.connection.commit()
            env = Environment(registry, cr=cr, uid=1)
            reg = load_views_registry_from_db(env)
        self.assertIn("menus", reg)
        self.assertGreater(len(reg["menus"]), 0, "Menus should be non-empty after load_default_data")

    def test_auto_upgrade_keeps_xml_fallback_when_db_empty(self):
        """When DB has no menus, load_views_registry_from_db keeps XML menus (no overwrite)."""
        class MockMenu:
            @classmethod
            def search_read(cls, domain=None, fields=None, offset=0, limit=None, order=None):
                return []  # Empty DB

        class MockEnv:
            def get(self, name, default=None):
                if name == "ir.ui.menu":
                    return MockMenu
                return default

        reg = load_views_registry_from_db(MockEnv())
        self.assertIn("menus", reg)
        self.assertGreater(len(reg["menus"]), 0, "Should fall back to XML menus when DB empty")
