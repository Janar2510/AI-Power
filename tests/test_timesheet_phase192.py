"""Phase 192: Timesheets - analytic.line with employee_id, task_id, project_id."""

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


class TestTimesheetPhase192(unittest.TestCase):
    """Test analytic.line timesheet fields and project.task timesheet_ids."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_timesheet_create_with_employee_task_project(self):
        """Create analytic line with employee_id, task_id, project_id."""
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
            AnalyticLine = env.get("analytic.line")
            AnalyticAccount = env.get("analytic.account")
            HrEmployee = env.get("hr.employee")
            ProjectProject = env.get("project.project")
            ProjectTask = env.get("project.task")
            if not all([AnalyticLine, AnalyticAccount, HrEmployee, ProjectProject, ProjectTask]):
                self.skipTest("Models not loaded")
            acc = AnalyticAccount.search([], limit=1)
            if not acc.ids:
                acc = AnalyticAccount.create({"name": "TS Account", "code": "TS01"})
            emp = HrEmployee.search([], limit=1)
            if not emp.ids:
                emp = HrEmployee.create({"name": "Test Employee"})
            proj = ProjectProject.search([], limit=1)
            if not proj.ids:
                proj = ProjectProject.create({"name": "Test Project"})
            task = ProjectTask.create({
                "name": "Test Task",
                "project_id": proj.ids[0],
            })
            line = AnalyticLine.create({
                "name": "Dev work",
                "date": "2025-03-15",
                "account_id": acc.ids[0],
                "employee_id": emp.ids[0],
                "task_id": task.ids[0],
                "project_id": proj.ids[0],
                "unit_amount": 4.0,
                "amount": 0.0,
            })
            self.assertTrue(line.ids)
            row = line.read(["employee_id", "task_id", "project_id", "unit_amount"])[0]
            self.assertEqual(row.get("unit_amount"), 4.0)
            self.assertIsNotNone(row.get("employee_id"))
            self.assertIsNotNone(row.get("task_id"))
            self.assertIsNotNone(row.get("project_id"))

    def test_task_timesheet_ids(self):
        """project.task timesheet_ids returns linked analytic lines."""
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
            AnalyticLine = env.get("analytic.line")
            AnalyticAccount = env.get("analytic.account")
            ProjectProject = env.get("project.project")
            ProjectTask = env.get("project.task")
            if not all([AnalyticLine, AnalyticAccount, ProjectProject, ProjectTask]):
                self.skipTest("Models not loaded")
            acc = AnalyticAccount.search([], limit=1)
            if not acc.ids:
                acc = AnalyticAccount.create({"name": "TS2", "code": "TS02"})
            proj = ProjectProject.search([], limit=1)
            if not proj.ids:
                proj = ProjectProject.create({"name": "Proj2"})
            task = ProjectTask.create({"name": "Task2", "project_id": proj.ids[0]})
            AnalyticLine.create({
                "name": "Hours",
                "date": "2025-03-16",
                "account_id": acc.ids[0],
                "task_id": task.ids[0],
                "unit_amount": 2.0,
            })
            task_rec = ProjectTask.browse(task.ids[0])
            ts = task_rec.read(["timesheet_ids"])[0].get("timesheet_ids")
            self.assertIsNotNone(ts)
            self.assertGreaterEqual(len(ts) if isinstance(ts, (list, tuple)) else 0, 1)
