"""Phase 145: Database backup/restore cron and CLI."""

import unittest

from core.tools.config import parse_config
from core.modules import load_module_graph
from core.orm import Registry
from core.orm.models import ModelBase
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


def _has_db(dbname: str) -> bool:
    parse_config(["--addons-path=addons"])
    return db_exists(dbname)


class TestBackupPhase145(unittest.TestCase):
    """Phase 145: base.db.backup model and run()."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_ci"
        cls._has_db = _has_db(cls.db)

    def test_backup_model_registered(self):
        """base.db.backup model is registered and has run()."""
        if not self._has_db:
            self.skipTest("DB _test_ci not found")
        registry = Registry(self.db)
        ModelBase._registry = registry
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            from core.orm import Environment
            env = Environment(registry, cr=cr, uid=1)
            load_default_data(env)
            Backup = env.get("base.db.backup")
            self.assertIsNotNone(Backup, "base.db.backup should be registered")
            self.assertTrue(hasattr(Backup, "run"), "base.db.backup should have run()")
