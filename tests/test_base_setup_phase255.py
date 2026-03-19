"""Phase 255: base_setup module - res.config.settings."""

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


class TestBaseSetupPhase255(unittest.TestCase):
    """Test base_setup module."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_base_setup_255"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_res_config_settings_model_exists(self):
        """res.config.settings model is defined in base_setup."""
        from core.tools.config import parse_config
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        from core.modules import clear_loaded_addon_modules, load_module_graph
        from core.orm import Registry
        registry = Registry("_test_base_setup_255")
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        self.assertIn("res.config.settings", registry._models)

    def test_base_setup_module_loaded(self):
        """res.config.settings from base_setup."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_base_setup_255")
        with get_cursor(self.db) as cr:
            parse_config(["--addons-path=" + self._addons_path])
            registry = Registry(self.db)
            from core.orm.models import ModelBase
            ModelBase._registry = registry
            clear_loaded_addon_modules()
            load_module_graph()
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Settings = env.get("res.config.settings")
            self.assertIsNotNone(Settings, "res.config.settings from base_setup")

    def test_res_config_settings_create(self):
        """Create res.config.settings and execute."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_base_setup_255")
        with get_cursor(self.db) as cr:
            parse_config(["--addons-path=" + self._addons_path])
            registry = Registry(self.db)
            from core.orm.models import ModelBase
            ModelBase._registry = registry
            clear_loaded_addon_modules()
            load_module_graph()
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Settings = env.get("res.config.settings")
            if not Settings:
                self.skipTest("res.config.settings not loaded")
            rec = Settings.create({"show_effect": False})
            rec.execute()
            IrConfig = env.get("ir.config.parameter")
            val = IrConfig.get_param("base_setup.show_effect")
            self.assertEqual(val, "False")
