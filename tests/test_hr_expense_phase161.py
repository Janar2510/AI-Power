"""Phase 161: Expense module - hr.expense, hr.expense.sheet, approval workflow."""

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


class TestHrExpensePhase161(unittest.TestCase):
    """Test hr.expense and hr.expense.sheet."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_hr_expense_create(self):
        """hr.expense can be created with unit_amount, quantity."""
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
            Employee = env.get("hr.employee")
            Expense = env.get("hr.expense")
            if not Employee or not Expense:
                self.skipTest("hr.expense or hr.employee not loaded")
            employees = Employee.search([], limit=1)
            if not employees.ids:
                Employee.create({"name": "Test Employee"})
                employees = Employee.search([], limit=1)
            e = Expense.create({
                "name": "Lunch",
                "employee_id": employees.ids[0],
                "unit_amount": 25.50,
                "quantity": 2,
            })
            self.assertIsNotNone(e.id if hasattr(e, "id") else (e.ids[0] if e.ids else None))
            row = Expense.browse(e.ids[0]).read(["unit_amount", "quantity"])[0]
            self.assertAlmostEqual(float(row.get("unit_amount") or 0), 25.50, places=2)
            self.assertEqual(float(row.get("quantity") or 0), 2.0)

    def test_hr_expense_sheet_workflow(self):
        """hr.expense.sheet submit -> approve -> done."""
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
            Employee = env.get("hr.employee")
            Expense = env.get("hr.expense")
            Sheet = env.get("hr.expense.sheet")
            if not all([Employee, Expense, Sheet]):
                self.skipTest("Required models not loaded")
            employees = Employee.search([], limit=1)
            if not employees.ids:
                Employee.create({"name": "Test Employee"})
                employees = Employee.search([], limit=1)
            exp = Expense.create({
                "name": "Travel",
                "employee_id": employees.ids[0],
                "unit_amount": 100,
                "quantity": 1,
            })
            sheet = Sheet.create({
                "employee_id": employees.ids[0],
            })
            exp.write({"sheet_id": sheet.id})
            self.assertEqual(sheet.read(["state"])[0].get("state"), "draft")
            sheet.action_submit()
            self.assertEqual(sheet.read(["state"])[0].get("state"), "submit")
            sheet.action_approve()
            self.assertEqual(sheet.read(["state"])[0].get("state"), "approve")
