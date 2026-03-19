"""Phase 238: Resource + HR Time Off (hr_holidays)."""

import unittest
from pathlib import Path

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.db.schema import add_missing_columns
from core.sql_db import get_cursor, db_exists


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


def _setup_env(db: str, addons_path: str, cr):
    parse_config(["--addons-path=" + addons_path])
    registry = Registry(db)
    from core.orm.models import ModelBase
    ModelBase._registry = registry
    clear_loaded_addon_modules()
    load_module_graph()
    init_schema(cr, registry)
    add_missing_columns(cr, registry)
    env = Environment(registry, cr=cr, uid=1)
    registry.set_env(env)
    load_default_data(env)
    return env


class TestResourceHrHolidaysPhase238(unittest.TestCase):
    """Test resource.calendar, resource.resource, hr_holidays integration."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_resource_hr_238"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_resource_models_exist(self):
        """resource.calendar, resource.calendar.attendance, resource.resource exist."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_resource_hr_238")
        with get_cursor(self.db) as cr:
            env = _setup_env(self.db, self._addons_path, cr)
            Cal = env.get("resource.calendar")
            Att = env.get("resource.calendar.attendance")
            Res = env.get("resource.resource")
            self.assertIsNotNone(Cal)
            self.assertIsNotNone(Att)
            self.assertIsNotNone(Res)

    def test_resource_calendar_crud(self):
        """Create resource.calendar with attendance."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_resource_hr_238")
        with get_cursor(self.db) as cr:
            env = _setup_env(self.db, self._addons_path, cr)
            Cal = env.get("resource.calendar")
            if not Cal:
                self.skipTest("resource.calendar not found")
            cal = Cal.create({"name": "Standard 9-5"})
            self.assertIsNotNone(cal)
            Att = env.get("resource.calendar.attendance")
            Att.create({
                "calendar_id": cal.id,
                "dayofweek": "0",
                "hour_from": 9.0,
                "hour_to": 17.0,
            })
            rows = cal.read(["name", "attendance_ids"])
            self.assertEqual(rows[0]["name"], "Standard 9-5")
            self.assertTrue(rows[0].get("attendance_ids"))

    def test_hr_employee_has_resource_calendar(self):
        """hr.employee has resource_calendar_id (from hr_holidays)."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_resource_hr_238")
        with get_cursor(self.db) as cr:
            env = _setup_env(self.db, self._addons_path, cr)
            Employee = env.get("hr.employee")
            if not Employee:
                self.skipTest("hr.employee not found")
            self.assertTrue(hasattr(Employee, "resource_calendar_id"))
