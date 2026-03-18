"""Phase 222: Tests for AI document processing (process_document tool)."""

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


class TestDocumentOcrPhase222(unittest.TestCase):
    """Test Phase 222: process_document tool."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_process_document_returns_structure(self):
        """process_document with invalid/missing attachment returns error structure."""
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
            from addons.ai_assistant.tools.registry import execute_tool
            result = execute_tool(env, "process_document", attachment_id=999999, create_bill=False)
            self.assertIn("data", result)
            self.assertIn("move_id", result)
            self.assertIn("error", result)
            self.assertIsNone(result["data"])
            self.assertIsNone(result["move_id"])
            self.assertIn("not found", result.get("error", "").lower())
