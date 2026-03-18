"""Phase 231: AI anomaly detection tests."""

import unittest
from pathlib import Path

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestAnomalyPhase231(unittest.TestCase):
    """Test detect_anomalies, explain_anomaly tools."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_anomaly_231"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_detect_anomalies_returns_structure(self):
        """detect_anomalies returns {anomalies, count, error}."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_anomaly_231")
        parse_config(["--addons-path=" + self._addons_path])
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            from addons.ai_assistant.tools.registry import execute_tool
            result = execute_tool(env, "detect_anomalies", model="account.move", lookback_days=30)
            self.assertIn("anomalies", result)
            self.assertIn("count", result)
            self.assertIsInstance(result["anomalies"], list)

    def test_explain_anomaly_handles_missing(self):
        """explain_anomaly returns error when anomaly not found."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_anomaly_231")
        parse_config(["--addons-path=" + self._addons_path])
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            from addons.ai_assistant.tools.registry import execute_tool
            result = execute_tool(env, "explain_anomaly", anomaly_id=999999, use_llm=False)
            self.assertIn("error", result)
            self.assertTrue(result.get("error") or not result.get("explanation"))
