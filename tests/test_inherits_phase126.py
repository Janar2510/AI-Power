"""Phase 126: _inherits delegation inheritance."""

import unittest

from core.tools.config import parse_config
from core.modules import load_module_graph, clear_loaded_addon_modules
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from core.http.auth import hash_password


def _ensure_test_db(dbname: str) -> bool:
    parse_config(["--addons-path=addons"])
    return db_exists(dbname)


class TestInheritsPhase126(unittest.TestCase):
    """Phase 126: _inherits creates parent, read/write delegate to parent."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_inherits_126"
        cls._has_db = _ensure_test_db(cls.db)

    def test_res_users_create_creates_partner(self):
        """Creating res.users with name/email creates res.partner and links via partner_id."""
        if not self._has_db:
            self.skipTest("DB _test_inherits_126 not found; run: ./erp-bin db init -d _test_inherits_126")
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
            User = env.get("res.users")
            Partner = env.get("res.partner")
            if not User or not Partner:
                self.skipTest("res.users or res.partner not loaded")
            existing = User.search([("login", "=", "test_inherits_126")])
            if existing:
                existing.unlink()
            user = User.create({
                "login": "test_inherits_126",
                "password": hash_password("test"),
                "name": "Test Inherits User",
                "email": "inherits@test.com",
            })
            self.assertTrue(user.id, "User should be created")
            row = user.read(["name", "email", "partner_id", "login"])
            self.assertEqual(len(row), 1)
            self.assertEqual(row[0].get("name"), "Test Inherits User", "name from partner")
            self.assertEqual(row[0].get("email"), "inherits@test.com", "email from partner")
            self.assertTrue(row[0].get("partner_id"), "partner_id should be set")
            self.assertEqual(row[0].get("login"), "test_inherits_126")
            partner_id = row[0]["partner_id"]
            partner_row = Partner.browse(partner_id).read(["name", "email"])
            self.assertEqual(partner_row[0].get("name"), "Test Inherits User")
            self.assertEqual(partner_row[0].get("email"), "inherits@test.com")

    def test_res_users_write_propagates_to_partner(self):
        """Writing name/email on res.users propagates to res.partner."""
        if not self._has_db:
            self.skipTest("DB _test_inherits_126 not found")
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
            User = env.get("res.users")
            Partner = env.get("res.partner")
            if not User or not Partner:
                self.skipTest("res.users or res.partner not loaded")
            user = User.search([("login", "=", "test_inherits_126")], limit=1)
            if not user:
                user = User.create({
                    "login": "test_inherits_126",
                    "password": hash_password("test"),
                    "name": "Original Name",
                })
            user.write({"name": "Updated Via User", "email": "updated@test.com"})
            row = user.read(["name", "email", "partner_id"])
            self.assertEqual(row[0].get("name"), "Updated Via User")
            self.assertEqual(row[0].get("email"), "updated@test.com")
            partner_row = Partner.browse(row[0]["partner_id"]).read(["name", "email"])
            self.assertEqual(partner_row[0].get("name"), "Updated Via User")
            self.assertEqual(partner_row[0].get("email"), "updated@test.com")
