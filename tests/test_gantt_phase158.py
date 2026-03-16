"""Phase 158: Gantt view - project.task, mrp.production date_start/date_end."""

import unittest

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


def _ensure_test_db(dbname: str) -> bool:
    from pathlib import Path
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestGanttPhase158(unittest.TestCase):
    """Test Gantt view fields on project.task and mrp.production."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_project_task_date_start(self):
        """project.task has date_start field."""
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
            Task = env.get("project.task")
            if not Task:
                self.skipTest("project.task not loaded")
            t = Task.create({"name": "Gantt Task", "date_start": "2025-03-01", "date_deadline": "2025-03-15"})
            row = Task.browse(t.ids[0]).read(["date_start", "date_deadline"])[0]
            self.assertIn("2025-03", str(row.get("date_start") or ""))
            self.assertIn("2025-03", str(row.get("date_deadline") or ""))

    def test_mrp_production_date_fields(self):
        """mrp.production has date_start, date_finished."""
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
            load_default_data(env)
            Product = env.get("product.product")
            Mrp = env.get("mrp.production")
            if not Mrp or not Product:
                self.skipTest("mrp.production or product.product not loaded")
            products = Product.search([], limit=1)
            if not products.ids:
                Product.create({"name": "Test Product", "list_price": 10})
                products = Product.search([], limit=1)
            mo = Mrp.create({
                "product_id": products.ids[0],
                "date_start": "2025-03-01 08:00:00",
                "date_finished": "2025-03-05 17:00:00",
            })
            row = Mrp.browse(mo.ids[0]).read(["date_start", "date_finished"])[0]
            self.assertIn("2025-03", str(row.get("date_start") or ""))
            self.assertIn("2025-03", str(row.get("date_finished") or ""))
