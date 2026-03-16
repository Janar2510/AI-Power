"""Phase 160: Advanced form widgets - priority, progressbar, phone, email, url."""

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


class TestWidgetsPhase160(unittest.TestCase):
    """Test priority, progress fields on crm.lead and project.task."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_crm_lead_priority(self):
        """crm.lead has priority field."""
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
            Lead = env.get("crm.lead")
            if not Lead:
                self.skipTest("crm.lead not loaded")
            l = Lead.create({"name": "Test Lead", "priority": "2"})
            row = Lead.browse(l.ids[0]).read(["priority"])[0]
            self.assertEqual(row.get("priority"), "2")

    def test_project_task_progress(self):
        """project.task has progress field."""
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
            t = Task.create({"name": "Test Task", "progress": 75.5})
            row = Task.browse(t.ids[0]).read(["progress"])[0]
            self.assertAlmostEqual(float(row.get("progress") or 0), 75.5, places=1)
