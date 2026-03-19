"""Phase 267: _read_group and _read_grouping_sets."""

import unittest
from pathlib import Path

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.sql_db import get_cursor, db_exists


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestReadGroupPhase267(unittest.TestCase):
    """Phase 267: _read_group, _read_grouping_sets."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_read_group_267"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_read_group_backward_compat(self):
        """read_group still returns list of dicts with __count."""
        if not self._has_db:
            self.skipTest("DB not found")
        with get_cursor(self.db) as cr:
            from core.db.init_data import load_default_data
            registry = Registry(self.db)
            from core.orm.models import ModelBase
            ModelBase._registry = registry
            clear_loaded_addon_modules()
            load_module_graph()
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Partner = env.get("res.partner")
            if not Partner:
                self.skipTest("res.partner not found")
            result = Partner.read_group(
                domain=[],
                fields=["id"],
                groupby=["country_id"],
                env=env,
            )
            self.assertIsInstance(result, list)
            for row in result:
                self.assertIsInstance(row, dict)
                self.assertIn("__count", row)

    def test_read_group_model_has_methods(self):
        """Model has _read_group and _read_grouping_sets."""
        from core.orm.models import ModelBase
        self.assertTrue(hasattr(ModelBase, "_read_group"))
        self.assertTrue(hasattr(ModelBase, "_read_grouping_sets"))
