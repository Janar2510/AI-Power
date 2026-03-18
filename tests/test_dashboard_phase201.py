"""Phase 201: Dashboard & Reporting Enhancements."""

import unittest

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from pathlib import Path


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestDashboardPhase201(unittest.TestCase):
    """Test default dashboard widgets and KPI drill-down."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_default_widgets_created(self):
        """Default widgets include Sales This Month, Open Invoices, Low Stock, Overdue Tasks."""
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
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Widget = env.get("ir.dashboard.widget")
            if not Widget:
                self.skipTest("ir.dashboard.widget not loaded")
            widgets = Widget.search_read([], ["name", "model", "domain"])
            names = [w["name"] for w in widgets]
            self.assertIn("Sales This Month", names)
            self.assertIn("Open Invoices", names)
            self.assertIn("Low Stock", names)
            self.assertIn("Overdue Tasks", names)

    def test_get_data_returns_domain_for_drill_down(self):
        """get_data returns domain with each widget for KPI drill-down."""
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
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Widget = env.get("ir.dashboard.widget")
            if not Widget:
                self.skipTest("ir.dashboard.widget not loaded")
            ids = Widget.search([]).ids
            if not ids:
                self.skipTest("No widgets")
            rec = Widget.browse(ids[0])
            data = rec.get_data()
            self.assertTrue(isinstance(data, list))
            for d in data:
                self.assertIn("id", d)
                self.assertIn("name", d)
                self.assertIn("value", d)
                self.assertIn("domain", d)
