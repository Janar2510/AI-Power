"""Phase 162: DB Upgrade CLI + Data Reload."""

import unittest

from core.tools.config import parse_config
from core.modules import load_module_graph
from core.orm import Registry, Environment
from core.orm.models import ModelBase
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from core.upgrade.runner import run_upgrade


def _ensure_test_db(dbname: str) -> bool:
    parse_config(["--addons-path=addons"])
    return db_exists(dbname)


class TestDbUpgradePhase162(unittest.TestCase):
    """Phase 162: db upgrade runs init_schema + load_default_data idempotently."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)

    def test_upgrade_runs_load_default_data(self):
        """run_upgrade calls load_default_data; menus/actions/views are reloaded."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        with get_cursor(self.db) as cr:
            run_upgrade(cr, self.db, None)
            cr.connection.commit()
        registry = Registry(self.db)
        ModelBase._registry = registry
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            Menu = env.get("ir.ui.menu")
            ActWindow = env.get("ir.actions.act_window")
            if not Menu or not ActWindow:
                self.skipTest("ir.ui.menu or ir.actions.act_window not loaded")
            menus = Menu.search_read([], ["id", "name", "xml_id"], limit=10)
            actions = ActWindow.search_read([], ["id", "name", "xml_id"], limit=10)
        self.assertGreater(len(menus), 0, "Menus should be loaded after upgrade")
        self.assertGreater(len(actions), 0, "Actions should be loaded after upgrade")

    def test_load_default_data_idempotent(self):
        """load_default_data is idempotent; re-running does not duplicate or corrupt data."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        registry = Registry(self.db)
        ModelBase._registry = registry
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            Menu = env.get("ir.ui.menu")
            if not Menu:
                self.skipTest("ir.ui.menu not loaded")
            before = len(Menu.search([]))
            load_default_data(env)
            after = len(Menu.search([]))
        self.assertEqual(before, after, "Re-running load_default_data should not duplicate menus")
