"""Phase 233: Event module tests."""

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


class TestEventPhase233(unittest.TestCase):
    """Test event.event, event.registration."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_event_233"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_event_create(self):
        """Create event."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_event_233")
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
            Event = env.get("event.event")
            if not Event:
                self.skipTest("event module not loaded")
            ev = Event.create({"name": "Tech Summit 2025"})
            self.assertIsNotNone(ev.id)
            self.assertEqual(ev.name, "Tech Summit 2025")
            data = ev.read(["state"])[0] if ev.read(["state"]) else {}
            self.assertEqual(data.get("state"), "draft")

    def test_event_registration(self):
        """Create event and registration."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_event_233")
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
            Event = env.get("event.event")
            Reg = env.get("event.registration")
            if not Event or not Reg:
                self.skipTest("event module not loaded")
            ev = Event.create({"name": "Workshop"})
            reg = Reg.create({"event_id": ev.id, "email": "user@example.com"})
            self.assertIsNotNone(reg.id)
            data = reg.read(["event_id", "state"])[0] if reg.read(["event_id", "state"]) else {}
            self.assertEqual(data.get("event_id", [None])[0], ev.id)
            self.assertEqual(data.get("state"), "draft")
