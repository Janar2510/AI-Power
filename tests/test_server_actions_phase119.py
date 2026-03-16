"""Phase 119: Server actions + base.automation - trigger on lead create."""

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


class TestServerActionsPhase119(unittest.TestCase):
    """Test automation rule triggers on lead create."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_automation_on_create_sets_description(self):
        """Create automation rule, create lead, verify description set by automation."""
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
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            ServerAction = env.get("ir.actions.server")
            Automation = env.get("base.automation")
            Lead = env.get("crm.lead")
            if not all([ServerAction, Automation, Lead]):
                self.skipTest("Required models not loaded: ir.actions.server, base.automation, crm.lead")
            # Create server action: on run, write description to record
            action = ServerAction.create({
                "name": "Set description on lead",
                "state": "code",
                "code": "records.write({'description': 'Auto-set by automation'})",
            })
            self.assertIsNotNone(action.id)
            # Create automation: on_create for crm.lead
            rule = Automation.create({
                "name": "Lead create: set description",
                "model_name": "crm.lead",
                "trigger": "on_create",
                "action_server_id": action.id,
                "active": True,
            })
            self.assertIsNotNone(rule.id)
            # Create a lead (automation runs on_create)
            lead = Lead.create({
                "name": "Test Lead Auto",
                "type": "lead",
            })
            self.assertIsNotNone(lead.id)
            # Verify automation flow: run_base_automation called, rules found, action.run invoked
            data = lead.read(["description"])
            desc = data[0].get("description") if data else None
            self.assertEqual(desc, "Auto-set by automation", f"Expected automation to set description, got {desc!r}")
