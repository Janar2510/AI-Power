"""Phase 232: Maintenance module tests."""

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


class TestMaintenancePhase232(unittest.TestCase):
    """Test maintenance equipment, request flow."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_maintenance_232"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_maintenance_equipment_create(self):
        """Create equipment and category."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_maintenance_232")
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
            Cat = env.get("maintenance.equipment.category")
            Equip = env.get("maintenance.equipment")
            if not Cat or not Equip:
                self.skipTest("maintenance module not loaded")
            cat = Cat.create({"name": "Computers"})
            self.assertIsNotNone(cat.id)
            eq = Equip.create({"name": "Laptop 1", "category_id": cat.id})
            self.assertIsNotNone(eq.id)
            self.assertEqual(eq.name, "Laptop 1")

    def test_maintenance_request_flow(self):
        """Create maintenance request and change state."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_maintenance_232")
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
            Equip = env.get("maintenance.equipment")
            Req = env.get("maintenance.request")
            if not Equip or not Req:
                self.skipTest("maintenance module not loaded")
            eq = Equip.create({"name": "Printer A"})
            req = Req.create({"equipment_id": eq.id, "request_type": "corrective"})
            self.assertIsNotNone(req.id)
            data = req.read(["state"])[0] if req.read(["state"]) else {}
            self.assertEqual(data.get("state"), "new")
            req.write({"state": "in_progress"})
            data = req.read(["state"])[0] if req.read(["state"]) else {}
            self.assertEqual(data.get("state"), "in_progress")
