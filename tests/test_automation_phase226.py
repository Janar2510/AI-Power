"""Phase 226: Workflow automation engine - on_write, on_time, action types (update, webhook)."""

import json
import unittest
from unittest.mock import patch, MagicMock

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


class TestAutomationPhase226(unittest.TestCase):
    """Test base.automation on_write, on_time, update action type."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_automation_226"
        cls.db_ontime = "_test_automation_226_ontime"
        cls._has_db = _ensure_test_db(cls.db)
        cls._has_db_ontime = _ensure_test_db(cls.db_ontime)
        cls._addons_path = str(addons_path)

    def test_automation_on_write_update_action(self):
        """Create automation with action_type=update, trigger=on_write; verify fields updated."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_automation_226")
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
            Automation = env.get("base.automation")
            Lead = env.get("crm.lead")
            if not Automation or not Lead:
                self.skipTest("base.automation or crm.lead not loaded")
            rule = Automation.create({
                "name": "On write: set description",
                "model_name": "crm.lead",
                "trigger": "on_write",
                "action_type": "update",
                "update_vals": json.dumps({"description": "Updated by automation"}),
                "active": True,
            })
            self.assertIsNotNone(rule.id)
            lead = Lead.create({"name": "Lead for write test", "type": "lead"})
            self.assertIsNotNone(lead.id)
            lead.write({"expected_revenue": 5000})
            data = lead.read(["description"])
            desc = data[0].get("description") if data else None
            self.assertEqual(desc, "Updated by automation", f"Expected automation to set description, got {desc!r}")

    def test_automation_on_time_run(self):
        """Verify _run_on_time_automations finds and runs on_time rules."""
        if not self._has_db_ontime:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_automation_226_ontime")
        parse_config(["--addons-path=" + self._addons_path])
        registry = Registry(self.db_ontime)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        with get_cursor(self.db_ontime) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Automation = env.get("base.automation")
            ServerAction = env.get("ir.actions.server")
            Lead = env.get("crm.lead")
            if not all([Automation, ServerAction, Lead]):
                self.skipTest("Required models not loaded")
            action = ServerAction.create({
                "name": "On time: set description",
                "state": "code",
                "code": "records.write({'description': 'On-time automation ran'})",
            })
            rule = Automation.create({
                "name": "On time: leads",
                "model_name": "crm.lead",
                "trigger": "on_time",
                "filter_domain": json.dumps([["type", "=", "lead"]]),
                "action_type": "server_action",
                "action_server_id": action.id,
                "active": True,
            })
            lead = Lead.create({"name": "Lead for on_time", "type": "lead"})
            from addons.base.models.base_automation import BaseAutomation
            count = BaseAutomation._run_on_time_automations(env)
            self.assertGreaterEqual(count, 1)
            data = lead.read(["description"])
            desc = data[0].get("description") if data else None
            self.assertEqual(desc, "On-time automation ran", f"Expected on_time to run, got {desc!r}")

    def test_automation_webhook_action(self):
        """Create automation with action_type=webhook; verify webhook called (mocked)."""
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
            Automation = env.get("base.automation")
            Lead = env.get("crm.lead")
            if not Automation or not Lead:
                self.skipTest("Required models not loaded")
            with patch("urllib.request.urlopen") as mock_urlopen:
                mock_resp = MagicMock()
                mock_resp.getcode.return_value = 200
                mock_urlopen.return_value = mock_resp
                rule = Automation.create({
                    "name": "Webhook on create",
                    "model_name": "crm.lead",
                    "trigger": "on_create",
                    "action_type": "webhook",
                    "webhook_url": "https://example.com/webhook",
                    "active": True,
                })
                lead = Lead.create({"name": "Lead for webhook", "type": "lead"})
                self.assertIsNotNone(lead.id)
                mock_urlopen.assert_called()
                call_args = mock_urlopen.call_args
                self.assertIn(b"crm.lead", call_args[0][0].data)
                self.assertIn(b"on_create", call_args[0][0].data)
