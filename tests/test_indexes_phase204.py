"""Phase 204: Database indexing."""

import unittest

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.db import init_schema
from core.db.schema import _create_performance_indexes, table_exists
from core.sql_db import get_cursor, db_exists
from pathlib import Path


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestIndexesPhase204(unittest.TestCase):
    """Test performance indexes are created."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_indexes_created_on_init(self):
        """init_schema creates performance indexes; res_partner_email_idx exists when table has email."""
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
            cr.execute("SELECT 1 FROM pg_indexes WHERE indexname = 'res_partner_email_idx'")
            has_idx = cr.fetchone() is not None
            cr.execute("SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='res_partner'")
            has_table = cr.fetchone() is not None
            self.assertTrue(has_table, "res_partner table should exist")
            self.assertTrue(has_idx, "res_partner_email_idx should exist after init_schema")
