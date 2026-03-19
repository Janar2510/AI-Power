"""Phase 247: Standalone product module - product.template, product.product, etc."""

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


class TestProductPhase247(unittest.TestCase):
    """Test standalone product module."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_product_247"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_product_module_loaded(self):
        """product.template and product.product come from product module."""
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
            Template = env.get("product.template")
            Product = env.get("product.product")
            Category = env.get("product.category")
            Pricelist = env.get("product.pricelist")
            Supplierinfo = env.get("product.supplierinfo")
            self.assertIsNotNone(Template, "product.template from product module")
            self.assertIsNotNone(Product, "product.product from product module")
            self.assertIsNotNone(Category, "product.category from product module")
            self.assertIsNotNone(Pricelist, "product.pricelist from product module")
            self.assertIsNotNone(Supplierinfo, "product.supplierinfo from product module")

    def test_product_create_via_template(self):
        """Create product.template and get product.product variant."""
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
            Template = env.get("product.template")
            Product = env.get("product.product")
            if not Template or not Product:
                self.skipTest("Models not loaded")
            t = Template.create({"name": "Phase247 Product", "list_price": 42.0})
            tid = t.ids[0] if t.ids else t.id
            variants = Product.search([("product_template_id", "=", tid)])
            self.assertGreaterEqual(len(variants.ids), 1)
            v = variants[0]
            lp = v.read(["list_price"])[0].get("list_price")
            self.assertEqual(float(lp or 0), 42.0, f"list_price={lp}")

    def test_product_create_via_product_inherits(self):
        """Create product.product with name/list_price creates template via _inherits."""
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
            Product = env.get("product.product")
            if not Product:
                self.skipTest("product.product not loaded")
            p = Product.create({"name": "Widget X", "list_price": 9.99})
            self.assertTrue(p.ids or p.id)
            row = p.read(["name", "list_price"])[0]
            self.assertEqual(row.get("name"), "Widget X")
            self.assertEqual(float(row.get("list_price") or 0), 9.99)
