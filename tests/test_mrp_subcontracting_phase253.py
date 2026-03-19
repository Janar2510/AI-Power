"""Phase 253: mrp_subcontracting module."""

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


class TestMrpSubcontractingPhase253(unittest.TestCase):
    """Phase 253: mrp_subcontracting extends mrp.bom, stock.move, stock.warehouse, res.partner."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_mrp_subcontracting_253"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_mrp_subcontracting_module_loads(self):
        """mrp.bom has type=subcontracting, stock.move has is_subcontract."""
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
            run_upgrade(cr, self.db, None)
            cr.connection.commit()
        with get_cursor(self.db) as cr:
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Bom = env.get("mrp.bom")
            Move = env.get("stock.move")
            if not Bom or not Move:
                self.skipTest("Models not loaded")
            fields_bom = Bom.fields_get([])
            fields_move = Move.fields_get([])
            self.assertIn("type", fields_bom)
            self.assertIn("subcontractor_ids", fields_bom)
            self.assertIn("is_subcontract", fields_move)

    def test_bom_subcontracting_type(self):
        """Create BOM with type=subcontracting."""
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
            run_upgrade(cr, self.db, None)
            cr.connection.commit()
        with get_cursor(self.db) as cr:
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Bom = env.get("mrp.bom")
            Product = env.get("product.product")
            if not Bom or not Product:
                self.skipTest("Models not loaded")
            products = Product.search([], limit=1)
            if not products.ids:
                self.skipTest("No product in DB")
            bom = Bom.create({
                "name": "Subcontract BOM",
                "product_id": products.ids[0],
                "type": "subcontracting",
            })
            self.assertIsNotNone(bom.ids[0] if bom.ids else bom.id)
            read = bom.read(["type"])[0]
            self.assertEqual(read.get("type"), "subcontracting")
