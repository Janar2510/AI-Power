"""Phase 130: Email inbound (fetchmail module)."""

import unittest

from core.tools.config import parse_config
from core.modules import load_module_graph, clear_loaded_addon_modules
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


def _ensure_test_db(dbname: str) -> bool:
    parse_config(["--addons-path=addons"])
    return db_exists(dbname)


class TestFetchmailPhase130(unittest.TestCase):
    """Phase 130: fetchmail.server, mail.alias, run_fetchmail cron."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_fetchmail"
        cls._has_db = _ensure_test_db(cls.db)

    def test_fetchmail_module_loaded(self):
        """fetchmail.server and mail.alias models exist."""
        if not self._has_db:
            self.skipTest("DB _test_fetchmail not found")
        clear_loaded_addon_modules()
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        load_module_graph()
        FetchmailServer = registry.get("fetchmail.server")
        MailAlias = registry.get("mail.alias")
        self.assertIsNotNone(FetchmailServer)
        self.assertIsNotNone(MailAlias)

    def test_mail_alias_create_and_search(self):
        """Create mail.alias, search by alias_name."""
        if not self._has_db:
            self.skipTest("DB _test_fetchmail not found")
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
            Alias = env.get("mail.alias")
            if not Alias:
                self.skipTest("mail.alias not loaded")
            Alias.create({
                "alias_name": "leads@test.local",
                "alias_model": "crm.lead",
            })
            recs = Alias.search([("alias_name", "=", "leads@test.local")])
            self.assertEqual(len(recs), 1)
            row = recs.read(["alias_model"])[0]
            self.assertEqual(row["alias_model"], "crm.lead")

    def test_run_fetchmail_no_error_when_no_servers(self):
        """run_fetchmail completes without error when no active servers."""
        if not self._has_db:
            self.skipTest("DB _test_fetchmail not found")
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
            FetchmailServer = env.get("fetchmail.server")
            if not FetchmailServer:
                self.skipTest("fetchmail.server not loaded")
            result = FetchmailServer.run_fetchmail()
            self.assertIsInstance(result, int)
            self.assertEqual(result, 0)
