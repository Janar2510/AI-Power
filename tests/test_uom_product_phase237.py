"""Phase 237: UoM + Product with UoM."""

import unittest
from pathlib import Path

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.db.schema import add_missing_columns
from core.sql_db import get_cursor, db_exists


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


def _setup_env(db: str, addons_path: str, cr):
    parse_config(["--addons-path=" + addons_path])
    registry = Registry(db)
    from core.orm.models import ModelBase
    ModelBase._registry = registry
    clear_loaded_addon_modules()
    load_module_graph()
    init_schema(cr, registry)
    add_missing_columns(cr, registry)
    env = Environment(registry, cr=cr, uid=1)
    registry.set_env(env)
    load_default_data(env)
    return env


class TestUomProductPhase237(unittest.TestCase):
    """Test UoM and product.template uom_id."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_uom_product_237"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_uom_models_exist(self):
        """uom.category and uom.uom exist."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_uom_product_237")
        with get_cursor(self.db) as cr:
            env = _setup_env(self.db, self._addons_path, cr)
            UomCategory = env.get("uom.category")
            UomUom = env.get("uom.uom")
            self.assertIsNotNone(UomCategory)
            self.assertIsNotNone(UomUom)

    def test_uom_default_units(self):
        """Default Units, kg, g are created."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_uom_product_237")
        with get_cursor(self.db) as cr:
            env = _setup_env(self.db, self._addons_path, cr)
            Uom = env.get("uom.uom")
            if not Uom:
                self.skipTest("uom.uom not found")
            units = Uom.search([("name", "=", "Units")], limit=1)
            self.assertTrue(units.ids, "Units uom should exist")
            kg = Uom.search([("name", "=", "kg")], limit=1)
            self.assertTrue(kg.ids, "kg uom should exist")

    def test_product_template_has_uom_id(self):
        """product.template has uom_id field."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_uom_product_237")
        with get_cursor(self.db) as cr:
            env = _setup_env(self.db, self._addons_path, cr)
            Template = env.get("product.template")
            if not Template:
                self.skipTest("product.template not found")
            self.assertTrue(hasattr(Template, "uom_id"))

    def test_product_create_with_uom(self):
        """Create product with uom_id."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_uom_product_237")
        with get_cursor(self.db) as cr:
            env = _setup_env(self.db, self._addons_path, cr)
            Product = env.get("product.product")
            Uom = env.get("uom.uom")
            if not Product or not Uom:
                self.skipTest("product.product or uom.uom not found")
            u = Uom.search([("name", "=", "Units")], limit=1)
            self.assertTrue(u.ids, "Units uom required")
            rec = Product.create({"name": "Phase237 Product", "list_price": 10.0, "uom_id": u.ids[0]})
            self.assertIsNotNone(rec)
            rows = rec.read(["name", "uom_id"])
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0]["name"], "Phase237 Product")
            self.assertEqual(rows[0]["uom_id"], u.ids[0])
