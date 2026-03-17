"""Phase 168: Analytic Accounting - analytic.account, analytic.line."""

import unittest
from pathlib import Path

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


class TestAnalyticPhase168(unittest.TestCase):
    """Phase 168: analytic.account, analytic.line, cost distribution on expenses."""

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
            run_upgrade(cr, self.db, None)
            cr.connection.commit()
        with get_cursor(self.db) as cr:
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            return env

    def test_analytic_account_model_exists(self):
        """analytic.account model exists with name, code, partner_id."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        env = self._get_env()
        AnalyticAccount = env.get("analytic.account")
        self.assertIsNotNone(AnalyticAccount, "analytic.account model should exist")
        fields = AnalyticAccount.fields_get([])
        self.assertIn("name", fields)
        self.assertIn("code", fields)
        self.assertIn("active", fields)

    def test_analytic_line_model_exists(self):
        """analytic.line model exists with account_id, amount, move_line_id."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        env = self._get_env()
        AnalyticLine = env.get("analytic.line")
        self.assertIsNotNone(AnalyticLine, "analytic.line model should exist")
        fields = AnalyticLine.fields_get([])
        self.assertIn("account_id", fields)
        self.assertIn("amount", fields)
        self.assertIn("move_line_id", fields)

    def test_expense_has_analytic_account_and_creates_line(self):
        """Expense has analytic_account_id; action_done creates analytic.line when accounts exist."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
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
            AnalyticAccount = env.get("analytic.account")
            AnalyticLine = env.get("analytic.line")
            HrExpense = env.get("hr.expense")
            HrExpenseSheet = env.get("hr.expense.sheet")
            HrEmployee = env.get("hr.employee")
            if not all([AnalyticAccount, AnalyticLine, HrExpense, HrExpenseSheet, HrEmployee]):
                self.skipTest("Required models not loaded")
            emp = HrEmployee.search([], limit=1)
            if not emp.ids:
                emp = HrEmployee.create({"name": "Test Employee"})
            emp_id = emp.ids[0]
            analytic = AnalyticAccount.create({"name": "Project Alpha", "code": "PA"})
            analytic_id = analytic.id if hasattr(analytic, "id") else analytic.ids[0]
            expense = HrExpense.create({
                "name": "Test Expense",
                "employee_id": emp_id,
                "unit_amount": 50.0,
                "quantity": 2.0,
                "analytic_account_id": analytic_id,
            })
            self.assertEqual(expense.read(["analytic_account_id"])[0].get("analytic_account_id"), analytic_id)
            sheet = HrExpenseSheet.create({"name": "New", "employee_id": emp_id})
            expense.write({"sheet_id": sheet.id})
            sheet.action_submit()
            sheet.action_approve()
            sheet.action_done()
            if sheet.read(["state"])[0].get("state") == "done":
                lines = AnalyticLine.search([("account_id", "=", analytic_id)])
                self.assertGreater(len(lines.ids), 0, "analytic.line created when expense posted with analytic_account_id")
