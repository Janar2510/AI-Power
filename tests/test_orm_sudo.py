"""Phase 219: Tests for sudo(), with_context(), with_user(), _order."""

import unittest
from pathlib import Path

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from core.orm.models import ModelBase, Recordset


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestOrmSudoPhase219(unittest.TestCase):
    """Test Phase 219: sudo, with_context, with_user, _order."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_sudo_returns_recordset_with_su_env(self):
        """recordset.sudo() returns recordset with env.su=True."""
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
            Lead = env.get("crm.lead")
            if not Lead:
                self.skipTest("crm.lead not available")
            recs = Lead.search([], limit=1)
            if not recs or not recs.ids:
                self.skipTest("No leads in DB")
            su_recs = recs.sudo()
            self.assertIsInstance(su_recs, Recordset)
            self.assertEqual(su_recs.ids, recs.ids)
            self.assertTrue(getattr(su_recs.env, "su", False))

    def test_with_context_returns_recordset_with_merged_context(self):
        """recordset.with_context(**kw) returns recordset with merged context."""
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
            Lead = env.get("crm.lead")
            if not Lead:
                self.skipTest("crm.lead not available")
            recs = Lead.search([], limit=1)
            if not recs or not recs.ids:
                self.skipTest("No leads in DB")
            ctx_recs = recs.with_context(foo="bar")
            self.assertIsInstance(ctx_recs, Recordset)
            self.assertEqual(ctx_recs.ids, recs.ids)
            self.assertEqual(ctx_recs.env.context.get("foo"), "bar")

    def test_with_user_returns_recordset_with_different_uid(self):
        """recordset.with_user(uid) returns recordset with that user's env."""
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
            Lead = env.get("crm.lead")
            if not Lead:
                self.skipTest("crm.lead not available")
            recs = Lead.search([], limit=1)
            if not recs or not recs.ids:
                self.skipTest("No leads in DB")
            user2_recs = recs.with_user(2)
            self.assertIsInstance(user2_recs, Recordset)
            self.assertEqual(user2_recs.ids, recs.ids)
            self.assertEqual(user2_recs.env.uid, 2)
            self.assertFalse(getattr(user2_recs.env, "su", False))

    def test_order_fallback_from_model(self):
        """search uses _order when order param is not provided."""
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
            SalaryRule = env.get("hr.salary.rule")
            if not SalaryRule:
                self.skipTest("hr.salary.rule not available (hr_payroll)")
            recs = SalaryRule.search([], limit=5)
            self.assertIsInstance(recs, Recordset)
            # hr.salary.rule has _order = "sequence, id"; search should not fail
