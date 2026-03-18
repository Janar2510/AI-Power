"""Phase 210: Tests for model inheritance (_inherit, _inherits)."""

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


class TestModelInheritance(unittest.TestCase):
    """Test _inherit extension and _inherits delegation."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_inherit_merge_adds_fields(self):
        """Models with _inherit add fields to base model."""
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
            info = ResPartner.fields_get()
            self.assertIn("name", info)
            self.assertIn("display_name", info)

    def test_inherits_delegation_read(self):
        """_inherits delegates field read to parent model."""
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
            ResUsers = env.get("res.users")
            if not ResUsers:
                self.skipTest("res.users not available")
            recs = ResUsers.search([], limit=1)
            if not recs or not recs.ids:
                self.skipTest("No users in DB")
            rows = recs.read(["id", "login", "name"])
            self.assertGreater(len(rows), 0)
            self.assertIn("name", rows[0])
