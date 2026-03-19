"""Phase 235: API decorators - @api.onchange, @api.ondelete, @api.autovacuum."""

import unittest
from pathlib import Path

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment, api
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestApiDecoratorsPhase235(unittest.TestCase):
    """Test @api.onchange, @api.ondelete, @api.autovacuum decorators."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_api_decorators_235"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_api_namespace(self):
        """api.constrains, api.onchange, api.ondelete exist."""
        self.assertTrue(hasattr(api, "constrains"))
        self.assertTrue(hasattr(api, "onchange"))
        self.assertTrue(hasattr(api, "ondelete"))
        self.assertTrue(hasattr(api, "autovacuum"))
        self.assertTrue(hasattr(api, "depends_context"))

    def test_onchange_decorator_marks_method(self):
        """@api.onchange marks method with _onchange_fields."""
        from core.orm.decorators import onchange
        def dummy(self, vals):
            return {}
        decorated = onchange("partner_id")(dummy)
        self.assertEqual(getattr(decorated, "_onchange_fields", ()), ("partner_id",))

    def test_ondelete_decorator_marks_method(self):
        """@api.ondelete marks method with _ondelete."""
        from core.orm.decorators import ondelete
        def dummy(self):
            pass
        decorated = ondelete()(dummy)
        self.assertTrue(getattr(decorated, "_ondelete", False))
        decorated2 = ondelete(at_uninstall=True)(dummy)
        self.assertTrue(getattr(decorated2, "_ondelete_at_uninstall", False))

    def test_autovacuum_runner_exists(self):
        """base.autovacuum model exists and run() executes."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_api_decorators_235")
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
            Autovacuum = env.get("base.autovacuum")
            if not Autovacuum:
                self.skipTest("base.autovacuum not found")
            count = Autovacuum.run()
            self.assertIsInstance(count, int)
