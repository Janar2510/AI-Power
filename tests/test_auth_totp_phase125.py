"""Phase 125: Two-Factor Authentication (TOTP) - enable, verify, login flow."""

import unittest
from pathlib import Path

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data, assign_admin_groups
from core.sql_db import get_cursor, db_exists
from core.http.auth import (
    user_has_totp_enabled,
    verify_totp_code,
    save_totp_to_user,
    disable_totp_for_user,
    hash_password,
)


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestAuthTotpPhase125(unittest.TestCase):
    """Test TOTP 2FA - model fields, verify, login flow."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)
        if cls._has_db:
            parse_config(["--addons-path=" + str(addons_path)])
            registry = Registry(cls.db)
            from core.orm.models import ModelBase
            ModelBase._registry = registry
            clear_loaded_addon_modules()
            load_module_graph()
            with get_cursor(cls.db) as cr:
                init_schema(cr, registry)
                env = Environment(registry, cr=cr, uid=1)
                load_default_data(env)
                User = env["res.users"]
                if not User.search([("login", "=", "admin")]):
                    User.create({
                        "login": "admin",
                        "password": hash_password("admin"),
                        "name": "Administrator",
                    })
                assign_admin_groups(env)

    def test_user_has_totp_enabled_false_by_default(self):
        """New users have totp_enabled=False."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found")
        self.assertFalse(user_has_totp_enabled(1, self.db))

    def test_save_and_verify_totp(self):
        """Save TOTP secret, enable, verify code (requires pyotp)."""
        try:
            import pyotp
        except ImportError:
            self.skipTest("pyotp not installed. Run: pip install pyotp")
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found")
        secret = pyotp.random_base32()
        self.assertTrue(save_totp_to_user(1, self.db, secret))
        self.assertTrue(user_has_totp_enabled(1, self.db))
        totp = pyotp.TOTP(secret)
        code = totp.now()
        self.assertTrue(verify_totp_code(1, self.db, code))
        self.assertFalse(verify_totp_code(1, self.db, "000000"))
        self.assertTrue(disable_totp_for_user(1, self.db))
        self.assertFalse(user_has_totp_enabled(1, self.db))

    def test_login_totp_redirects_when_enabled(self):
        """When user has TOTP enabled, login redirects to /web/login/totp."""
        try:
            import pyotp
        except ImportError:
            self.skipTest("pyotp not installed")
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found")
        secret = pyotp.random_base32()
        save_totp_to_user(1, self.db, secret)
        try:
            from werkzeug.test import Client
            from core.http import Application
            app = Application()
            client = Client(app)
            r = client.post(
                "/web/login",
                data={"login": "admin", "password": "admin", "db": self.db},
            )
            self.assertEqual(r.status_code, 302, r.get_data(as_text=True))
            self.assertIn("/web/login/totp", r.headers.get("Location", ""))
        finally:
            disable_totp_for_user(1, self.db)
