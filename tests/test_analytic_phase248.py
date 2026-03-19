"""Phase 248: Analytic module - standalone analytic.account, analytic.line, account.analytic.plan."""

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


def _get_env(addons_path: str, db: str):
    parse_config(["--addons-path=" + addons_path])
    registry = Registry(db)
    from core.orm.models import ModelBase
    ModelBase._registry = registry
    clear_loaded_addon_modules()
    load_module_graph()
    with get_cursor(db) as cr:
        init_schema(cr, registry)
        run_upgrade(cr, db, None)
        cr.connection.commit()
    with get_cursor(db) as cr:
        env = Environment(registry, cr=cr, uid=1)
        registry.set_env(env)
        load_default_data(env)
        return env


class TestAnalyticPhase248(unittest.TestCase):
    """Phase 248: analytic module loads, models exist, CRUD works."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_analytic_248"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_analytic_module_loads(self):
        """analytic module loads and provides analytic.account, analytic.line, account.analytic.plan."""
        if not self._has_db:
            self.skipTest("DB not found")
        env = _get_env(self._addons_path, self.db)
        AnalyticAccount = env.get("analytic.account")
        AnalyticLine = env.get("analytic.line")
        AnalyticPlan = env.get("account.analytic.plan")
        self.assertIsNotNone(AnalyticAccount, "analytic.account should exist")
        self.assertIsNotNone(AnalyticLine, "analytic.line should exist")
        self.assertIsNotNone(AnalyticPlan, "account.analytic.plan should exist")

    def test_analytic_account_crud(self):
        """Create and read analytic.account with plan_id."""
        if not self._has_db:
            self.skipTest("DB not found")
        env = _get_env(self._addons_path, self.db)
        AnalyticAccount = env.get("analytic.account")
        AnalyticPlan = env.get("account.analytic.plan")
        if not AnalyticAccount or not AnalyticPlan:
            self.skipTest("analytic models not available")
        plan = AnalyticPlan.create({"name": "Default Plan"})
        acc = AnalyticAccount.create({
            "name": "Project Alpha",
            "code": "PA",
            "plan_id": plan.id,
        })
        acc_id = acc.ids[0] if acc.ids else acc.id
        self.assertIsNotNone(acc_id)
        read = AnalyticAccount.browse(acc_id).read(["name", "code", "plan_id"])
        self.assertEqual(read[0]["name"], "Project Alpha")
        self.assertEqual(read[0]["code"], "PA")
        plan_id_val = read[0]["plan_id"]
        expected_plan_id = plan.ids[0] if plan.ids else plan.id
        self.assertEqual(plan_id_val, expected_plan_id, f"plan_id: got {plan_id_val}, expected {expected_plan_id}")

    def test_analytic_line_links_to_account(self):
        """analytic.line links to analytic.account."""
        if not self._has_db:
            self.skipTest("DB not found")
        env = _get_env(self._addons_path, self.db)
        AnalyticAccount = env.get("analytic.account")
        AnalyticLine = env.get("analytic.line")
        if not AnalyticAccount or not AnalyticLine:
            self.skipTest("analytic models not available")
        acc = AnalyticAccount.create({"name": "Cost Center A", "code": "CCA"})
        from datetime import date
        acc_id = acc.ids[0] if acc.ids else acc.id
        line = AnalyticLine.create({
            "name": "Test line",
            "date": date.today(),
            "account_id": acc_id,
            "amount": 100.0,
        })
        self.assertIsNotNone(line.ids[0] if line.ids else line.id)
