"""Phase 229: Barcode scanning - product barcode, parse, scan API."""

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


class TestBarcodePhase229(unittest.TestCase):
    """Test barcode field and parse logic."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_barcode_229"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_product_barcode(self):
        """Product has barcode field; create product with barcode, search by barcode."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_barcode_229")
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
            Product = env.get("product.product")
            if not Product:
                self.skipTest("product.product not found")
            p = Product.create({"name": "Barcode Product", "barcode": "5901234123457"})
            self.assertIsNotNone(p.id)
            found = Product.search([("barcode", "=", "5901234123457")])
            self.assertTrue(found.ids, "Should find product by barcode")
            self.assertEqual(found.ids[0], p.id if hasattr(p, "id") else p.ids[0])
