"""Phase 186: Payroll - hr.payslip, hr.salary.rule, compute_sheet."""

import unittest
from datetime import date

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


class TestPayrollPhase186(unittest.TestCase):
    """Test hr.payslip and hr.salary.rule."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_hr_salary_rule_create(self):
        """hr.salary.rule can be created."""
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
            Rule = env.get("hr.salary.rule")
            if not Rule:
                self.skipTest("hr.salary.rule not loaded")
            r = Rule.create({
                "name": "Basic",
                "code": "BASIC",
                "amount_percentage": 100.0,
            })
            self.assertIsNotNone(r.id if hasattr(r, "id") else (r.ids[0] if r.ids else None))
            row = Rule.browse(r.ids[0]).read(["code", "amount_percentage"])[0]
            self.assertEqual(row.get("code"), "BASIC")
            self.assertAlmostEqual(float(row.get("amount_percentage") or 0), 100.0, places=2)

    def test_hr_payslip_compute_sheet(self):
        """hr.payslip compute_sheet creates lines from salary rules."""
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
            Payslip = env.get("hr.payslip")
            Rule = env.get("hr.salary.rule")
            Line = env.get("hr.payslip.line")
            if not all([Employee, Payslip, Rule, Line]):
                self.skipTest("Payroll models not loaded")
            employees = Employee.search([], limit=1)
            if not employees.ids:
                emp = Employee.create({"name": "Test Employee", "wage": 3000.0})
                emp_id = emp.ids[0] if emp.ids else emp.id
            else:
                emp_id = employees.ids[0]
                Employee.browse(emp_id).write({"wage": 3000.0})
            Rule.create({"name": "Basic", "code": "BASIC", "amount_percentage": 100.0})
            Rule.create({"name": "Tax", "code": "TAX", "amount_percentage": -20.0})
            rules = Rule.search([])
            self.assertGreater(len(rules.ids), 0, "Salary rules should exist")
            slip = Payslip.create({
                "employee_id": emp_id,
                "date_from": date(2025, 1, 1),
                "date_to": date(2025, 1, 31),
            })
            slip.compute_sheet(env=env)
            slip_row = Payslip.browse(slip.ids[0]).read(["line_ids", "state"])[0]
            self.assertEqual(slip_row.get("state"), "done")
            line_ids = slip_row.get("line_ids") or []
            self.assertGreater(len(line_ids), 0, "compute_sheet should create payslip lines")
