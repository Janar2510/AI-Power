"""Phase 190: Helpdesk Module - helpdesk.ticket, helpdesk.stage, kanban."""

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


class TestHelpdeskPhase190(unittest.TestCase):
    """Test helpdesk.ticket and helpdesk.stage."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_helpdesk_ticket_create(self):
        """Create helpdesk ticket with stage."""
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
            Ticket = env.get("helpdesk.ticket")
            Stage = env.get("helpdesk.stage")
            if not all([Ticket, Stage]):
                self.skipTest("Helpdesk models not loaded")
            stages = Stage.search([], order="sequence")
            self.assertGreater(len(stages.ids), 0)
            stage_id = stages.ids[0] if stages.ids else stages.id
            t = Ticket.create({
                "name": "Test Ticket",
                "stage_id": stage_id,
                "description": "Test description",
            })
            self.assertIsNotNone(t.ids[0] if t.ids else t.id)
            row = t.read(["name", "stage_id"])[0] if t.read(["name", "stage_id"]) else {}
            self.assertEqual(row.get("name"), "Test Ticket")

    def test_helpdesk_stage_defaults(self):
        """Default helpdesk stages exist after init."""
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
            Stage = env.get("helpdesk.stage")
            if not Stage:
                self.skipTest("Helpdesk not loaded")
            stages = Stage.search_read([], ["name", "sequence"])
            names = [s.get("name") for s in stages]
            self.assertIn("New", names)
            self.assertIn("In Progress", names)
            self.assertIn("Solved", names)
