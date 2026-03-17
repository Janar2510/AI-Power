"""Phase 167: Calendar Module - calendar.event, calendar.attendee."""

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


class TestCalendarPhase167(unittest.TestCase):
    """Phase 167: calendar.event, calendar.attendee, meetings linked to partners."""

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

    def test_calendar_event_model_exists(self):
        """calendar.event model exists with required fields."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        env = self._get_env()
        Event = env.get("calendar.event")
        self.assertIsNotNone(Event, "calendar.event model should exist")
        fields = Event.fields_get([])
        self.assertIn("name", fields)
        self.assertIn("start", fields)
        self.assertIn("stop", fields)
        self.assertIn("partner_ids", fields)
        self.assertIn("location", fields)

    def test_calendar_attendee_model_exists(self):
        """calendar.attendee model exists with event_id, partner_id, state."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        env = self._get_env()
        Attendee = env.get("calendar.attendee")
        self.assertIsNotNone(Attendee, "calendar.attendee model should exist")
        fields = Attendee.fields_get([])
        self.assertIn("event_id", fields)
        self.assertIn("partner_id", fields)
        self.assertIn("state", fields)

    def test_create_calendar_event(self):
        """Create calendar event with name, start, stop, partner_ids."""
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
            Event = env.get("calendar.event")
            Partner = env.get("res.partner")
            if not Event or not Partner:
                self.skipTest("calendar.event or res.partner not loaded")
            partner = Partner.search([], limit=1)
            if not partner.ids:
                partner = Partner.create({"name": "Test Partner"})
            pid = partner.ids[0] if partner.ids else partner.id
            event = Event.create({
                "name": "Test Meeting",
                "start": "2025-06-15 10:00:00",
                "stop": "2025-06-15 11:00:00",
                "partner_ids": [[6, 0, [pid]]],
            })
            self.assertIsNotNone(event)
            eid = event.id if hasattr(event, "id") and event.id else (event.ids[0] if event.ids else None)
            self.assertIsNotNone(eid)
            row = Event.browse([eid]).read(["name", "start", "stop"])[0]
            self.assertEqual(row.get("name"), "Test Meeting")
            self.assertIn("2025-06-15", str(row.get("start", "")))
            self.assertIn("2025-06-15", str(row.get("stop", "")))
