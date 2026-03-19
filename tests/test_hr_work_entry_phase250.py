"""Phase 250: hr_work_entry module - work entry tracking."""

import unittest
from pathlib import Path
from datetime import datetime

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from core.upgrade.runner import run_upgrade


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestHrWorkEntryPhase250(unittest.TestCase):
    """Phase 250: hr_work_entry module loads, models exist, CRUD works."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_hr_work_entry_250"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_hr_work_entry_module_loads(self):
        """hr_work_entry provides hr.work.entry, hr.work.entry.type."""
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
            run_upgrade(cr, self.db, None)
            cr.connection.commit()
        with get_cursor(self.db) as cr:
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            WorkEntry = env.get("hr.work.entry")
            WorkEntryType = env.get("hr.work.entry.type")
            self.assertIsNotNone(WorkEntry)
            self.assertIsNotNone(WorkEntryType)

    def test_work_entry_crud(self):
        """Create work entry type and work entry."""
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
            run_upgrade(cr, self.db, None)
            cr.connection.commit()
        with get_cursor(self.db) as cr:
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            WorkEntry = env.get("hr.work.entry")
            WorkEntryType = env.get("hr.work.entry.type")
            HrEmployee = env.get("hr.employee")
            if not all([WorkEntry, WorkEntryType, HrEmployee]):
                self.skipTest("Models not loaded")
            wtype = WorkEntryType.create({"name": "Attendance", "code": "ATT"})
            employees = HrEmployee.search([], limit=1)
            if not employees.ids:
                self.skipTest("No employee in DB")
            emp_id = employees.ids[0]
            start = datetime(2025, 3, 19, 9, 0, 0)
            stop = datetime(2025, 3, 19, 17, 0, 0)
            entry = WorkEntry.create({
                "name": "Work Day",
                "employee_id": emp_id,
                "work_entry_type_id": wtype.ids[0] if wtype.ids else wtype.id,
                "date_start": start,
                "date_stop": stop,
                "state": "draft",
            })
            self.assertIsNotNone(entry.ids[0] if entry.ids else entry.id)
