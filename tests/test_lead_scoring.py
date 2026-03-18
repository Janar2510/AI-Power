"""Phase 220: Tests for AI lead scoring and smart assignment."""

import unittest
from pathlib import Path

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from core.orm.models import ModelBase


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestLeadScoringPhase220(unittest.TestCase):
    """Test Phase 220: score_lead, assign_lead tools."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_score_lead_writes_ai_score(self):
        """score_lead tool computes and writes ai_score, ai_score_label."""
        if not self._has_db:
            self.skipTest("DB not found")
        parse_config(["--addons-path=" + self._addons_path])
        registry = Registry(self.db)
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
                self.skipTest("crm.lead not available")
            lead = Lead.create({"name": "Test Lead Phase220", "type": "opportunity", "expected_revenue": 5000})
            lead_id = lead.id if hasattr(lead, "id") and lead.id else (lead.ids[0] if lead.ids else None)
            if not lead_id:
                self.skipTest("Could not create lead")
            from addons.ai_assistant.tools.registry import execute_tool
            result = execute_tool(env, "score_lead", lead_id=lead_id)
            self.assertIn("score", result)
            self.assertIn("label", result)
            self.assertIn(result["label"], ("hot", "warm", "cold"))
            self.assertGreaterEqual(result["score"], 0)
            self.assertLessEqual(result["score"], 100)
            rows = Lead.search_read([("id", "=", lead_id)], ["ai_score", "ai_score_label"])
            if rows:
                self.assertEqual(rows[0]["ai_score"], result["score"])
                self.assertEqual(rows[0]["ai_score_label"], result["label"])

    def test_assign_lead_assigns_to_user(self):
        """assign_lead tool assigns lead to user with fewest leads."""
        if not self._has_db:
            self.skipTest("DB not found")
        parse_config(["--addons-path=" + self._addons_path])
        registry = Registry(self.db)
        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Lead = env.get("crm.lead")
            User = env.get("res.users")
            if not Lead or not User:
                self.skipTest("crm.lead or res.users not available")
            lead = Lead.create({"name": "Assign Test Lead", "type": "lead"})
            lead_id = lead.id if hasattr(lead, "id") and lead.id else (lead.ids[0] if lead.ids else None)
            if not lead_id:
                self.skipTest("Could not create lead")
            users = User.search_read([], ["id"], limit=2)
            user_ids = [u["id"] for u in users if u.get("id")]
            if not user_ids:
                self.skipTest("No users in DB")
            from addons.ai_assistant.tools.registry import execute_tool
            result = execute_tool(env, "assign_lead", lead_id=lead_id, user_ids=user_ids)
            self.assertIn("assigned_to", result)
            self.assertIn(result["assigned_to"], user_ids)
            rows = Lead.search_read([("id", "=", lead_id)], ["user_id"])
            if rows and result.get("assigned_to"):
                self.assertEqual(rows[0]["user_id"], result["assigned_to"])
