"""Phase 149: HR Leave Management."""

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


class TestHrLeavePhase149(unittest.TestCase):
    """Test hr.leave, hr.leave.type, hr.leave.allocation."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def _get_env(self):
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
            return env

    def test_hr_leave_workflow(self):
        """Create leave type, employee, leave; test workflow."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        env = self._get_env()
        LeaveType = env.get("hr.leave.type")
        Employee = env.get("hr.employee")
        Leave = env.get("hr.leave")
        if not all([LeaveType, Employee, Leave]):
            self.skipTest("hr.leave not loaded")
        lt = LeaveType.create({"name": "Annual Leave", "allocation_type": "fixed", "max_leaves": 20})
        emp = Employee.search([], limit=1)
        if not emp.ids:
            emp = Employee.create({"name": "Test Employee"})
        leave = Leave.create({
            "employee_id": emp.ids[0],
            "leave_type_id": lt.ids[0],
            "date_from": "2025-06-02",
            "date_to": "2025-06-06",
        })
        self.assertIsNotNone(leave)
        row = leave.read(["number_of_days", "state"])[0]
        self.assertEqual(row.get("state"), "draft")
        self.assertEqual(row.get("number_of_days"), 5.0)
        Leave.browse(leave.ids).action_confirm()
        row = leave.read(["state"])[0]
        self.assertEqual(row.get("state"), "confirm")
        Leave.browse(leave.ids).action_validate()
        row = leave.read(["state"])[0]
        self.assertEqual(row.get("state"), "validate")
