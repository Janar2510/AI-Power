"""Phase 228: AI demand forecasting, cashflow, suggest_reorder tools."""

import unittest
from pathlib import Path

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists

from addons.ai_assistant.tools.forecasting import forecast_demand, forecast_cashflow, suggest_reorder


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestForecastingPhase228(unittest.TestCase):
    """Test forecast_demand, forecast_cashflow, suggest_reorder."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_forecasting_228"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_forecast_demand(self):
        """forecast_demand returns products or empty."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_forecasting_228")
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
            result = forecast_demand(env, use_llm=False)
            self.assertIn("products", result)
            self.assertIn("summary", result)
            self.assertIsNone(result.get("error"))

    def test_forecast_cashflow(self):
        """forecast_cashflow returns receivable, payable, projected."""
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
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            result = forecast_cashflow(env, use_llm=False)
            self.assertIn("receivable", result)
            self.assertIn("payable", result)
            self.assertIn("projected", result)
            self.assertIn("summary", result)

    def test_suggest_reorder(self):
        """suggest_reorder returns suggestions or empty."""
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
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            result = suggest_reorder(env)
            self.assertIn("suggestions", result)
            self.assertIn("summary", result)
            self.assertIsNone(result.get("error"))
