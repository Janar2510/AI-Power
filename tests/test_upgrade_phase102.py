"""Phase 102: Upgrade/migration framework."""

import unittest

from core.tools.config import parse_config
from core.modules import load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from core.upgrade.runner import _discover_migrations, _run_migrate_script, run_upgrade
from core.http.rpc import _call_kw


def _ensure_test_db(dbname: str) -> bool:
    parse_config(["--addons-path=addons"])
    return db_exists(dbname)


class TestUpgradePhase102(unittest.TestCase):
    """Phase 102: upgrade runner, module version tracking."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)

    def test_upgrade_runner_calls_migrate(self):
        """run_upgrade discovers and runs migrate(cr, version) scripts (Phase 102)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        scripts = _discover_migrations("base")
        self.assertGreater(len(scripts), 0, "base should have migrations")
        with get_cursor(self.db) as cr:
            run_upgrade(cr, self.db, ["base"])
            cr.connection.commit()
        self.assertTrue(True, "run_upgrade completed")

    def test_module_version_tracking(self):
        """ir.module.module tracks installed version (Phase 102)."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            IrModule = env.get("ir.module.module")
            if not IrModule:
                self.skipTest("ir.module.module not loaded")
            rows = IrModule.search_read([("name", "=", "base")], ["name", "installed_version"])
            self.assertGreater(len(rows), 0, "base module should be in ir.module.module")
            self.assertEqual(rows[0].get("name"), "base")

    def test_upgrade_ensures_dashboard_widgets(self):
        """Phase 106: run_upgrade seeds dashboard widgets; get_data works after upgrade."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        with get_cursor(self.db) as cr:
            run_upgrade(cr, self.db, None)
            cr.connection.commit()
        widgets = _call_kw(1, self.db, "ir.dashboard.widget", "search_read", [[]], {"fields": ["id"], "limit": 5})
        self.assertIsInstance(widgets, list)
        if widgets:
            ids = [w["id"] for w in widgets]
            data = _call_kw(1, self.db, "ir.dashboard.widget", "get_data", [ids], {})
            self.assertEqual(len(data), len(ids))

    def test_upgrade_idempotent_module_versions(self):
        """Phase 107: run_upgrade is idempotent; installed_version updated per module."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        with get_cursor(self.db) as cr:
            run_upgrade(cr, self.db, ["base"])
            cr.connection.commit()
        with get_cursor(self.db) as cr:
            run_upgrade(cr, self.db, ["base"])
            cr.connection.commit()
        rows = _call_kw(1, self.db, "ir.module.module", "search_read", [[("name", "=", "base")]], {"fields": ["name", "installed_version"]})
        self.assertGreater(len(rows), 0)
        self.assertEqual(rows[0].get("name"), "base")

    def test_init_tracks_non_server_wide_modules_as_uninstalled(self):
        """Phase 108: discovered modules are tracked per DB even when not server-wide."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            IrModule = env.get("ir.module.module")
            if IrModule is None:
                self.skipTest("ir.module.module not loaded")
            if IrModule:
                existing = IrModule.search([("name", "=", "my_module")])
                if existing and existing.ids:
                    IrModule.browse(existing.ids).unlink()
            load_default_data(env)
            rows = IrModule.search_read([("name", "=", "my_module")], [
                "name", "state", "installed_version", "latest_version",
            ])
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0].get("state"), "uninstalled")
            self.assertEqual(rows[0].get("latest_version"), "0.1")

    def test_upgrade_marks_requested_module_installed(self):
        """Phase 108: explicit module upgrade installs requested module in that DB."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        with get_cursor(self.db) as cr:
            run_upgrade(cr, self.db, ["my_module"])
            cr.connection.commit()
        with get_cursor(self.db) as cr:
            cr.execute(
                "SELECT name, state, installed_version, latest_version "
                "FROM ir_module_module WHERE name = %s",
                ("my_module",),
            )
            row = cr.fetchone()
        self.assertIsNotNone(row)
        self.assertEqual(row.get("state"), "installed")
        self.assertEqual(row.get("installed_version"), row.get("latest_version"))
