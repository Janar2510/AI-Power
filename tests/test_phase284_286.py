"""Phase 284-286: project bridge modules."""

import unittest
from pathlib import Path

from core.db import init_schema
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.sql_db import get_cursor
from core.tools.config import parse_config


class TestPhase284286(unittest.TestCase):
    """Parity checks for phases 284-286."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_phase284_286"
        cls.registry = Registry(cls.db)
        from core.orm.models import ModelBase

        ModelBase._registry = cls.registry
        clear_loaded_addon_modules()
        load_module_graph()
        try:
            with get_cursor(cls.db) as cr:
                init_schema(cr, cls.registry)
                cr.commit()
        except Exception:
            pass

    def test_phase284_project_todo_stock_sms(self):
        Task = self.registry.get("project.task")
        self.assertIsNotNone(Task)
        self.assertTrue(hasattr(Task, "action_convert_to_task"))
        self.assertTrue(hasattr(Task, "get_todo_views_id"))

        Users = self.registry.get("res.users")
        self.assertIsNotNone(Users)
        self.assertTrue(hasattr(Users, "_generate_onboarding_todo"))

        Project = self.registry.get("project.project")
        self.assertIsNotNone(Project)
        self.assertTrue(hasattr(Project, "action_open_deliveries"))
        self.assertTrue(hasattr(Project, "delivery_count"))
        self.assertTrue(hasattr(Project, "sms_template_id"))
        self.assertTrue(hasattr(Project, "_send_sms"))

        Picking = self.registry.get("stock.picking")
        self.assertIsNotNone(Picking)
        self.assertTrue(hasattr(Picking, "project_id"))

        TaskType = self.registry.get("project.task.type")
        self.assertIsNotNone(TaskType)
        self.assertTrue(hasattr(TaskType, "sms_template_id"))

    def test_phase285_project_purchase_hr_expense(self):
        Project = self.registry.get("project.project")
        self.assertIsNotNone(Project)
        self.assertTrue(hasattr(Project, "purchase_orders_count"))
        self.assertTrue(hasattr(Project, "action_open_project_purchase_orders"))
        self.assertTrue(hasattr(Project, "expense_count"))
        self.assertTrue(hasattr(Project, "action_open_project_expenses"))

        PurchaseOrder = self.registry.get("purchase.order")
        self.assertIsNotNone(PurchaseOrder)
        self.assertTrue(hasattr(PurchaseOrder, "project_id"))

        Expense = self.registry.get("hr.expense")
        self.assertIsNotNone(Expense)
        self.assertTrue(hasattr(Expense, "project_id"))
        self.assertTrue(hasattr(Expense, "_compute_analytic_distribution"))

    def test_phase286_project_sale_expense_timesheet_holidays(self):
        Project = self.registry.get("project.project")
        self.assertIsNotNone(Project)
        self.assertTrue(hasattr(Project, "_get_expenses_profitability_items"))

        MoveLine = self.registry.get("account.move.line")
        self.assertIsNotNone(MoveLine)
        self.assertTrue(hasattr(MoveLine, "expense_id"))
        self.assertTrue(hasattr(MoveLine, "_sale_determine_order"))

        AnalyticLine = self.registry.get("analytic.line")
        self.assertIsNotNone(AnalyticLine)
        self.assertTrue(hasattr(AnalyticLine, "holiday_id"))
        self.assertTrue(hasattr(AnalyticLine, "global_leave_id"))

        Leave = self.registry.get("hr.leave")
        self.assertIsNotNone(Leave)
        self.assertTrue(hasattr(Leave, "timesheet_ids"))
        self.assertTrue(hasattr(Leave, "_generate_timesheets"))

        Company = self.registry.get("res.company")
        self.assertIsNotNone(Company)
        self.assertTrue(hasattr(Company, "internal_project_id"))
        self.assertTrue(hasattr(Company, "leave_timesheet_task_id"))

        Task = self.registry.get("project.task")
        self.assertIsNotNone(Task)
        self.assertTrue(hasattr(Task, "leave_types_count"))
        self.assertTrue(hasattr(Task, "is_timeoff_task"))

        GlobalLeave = self.registry.get("resource.calendar.leaves")
        self.assertIsNotNone(GlobalLeave)
