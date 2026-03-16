"""Phase 155: Product variants - product.template, product.attribute, variant selector."""

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


class TestProductVariantPhase155(unittest.TestCase):
    """Test product template, attributes, variants."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_product_template_create(self):
        """product.template can be created with name, list_price."""
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
            if not Template:
                self.skipTest("product.template not loaded")
            t = Template.create({"name": "T-Shirt", "list_price": 29.99})
            self.assertIsNotNone(t.id if hasattr(t, "id") else (t.ids[0] if t.ids else None))
            row = Template.browse(t.ids[0]).read(["name", "list_price"])[0]
            self.assertEqual(row.get("name"), "T-Shirt")
            self.assertAlmostEqual(float(row.get("list_price") or 0), 29.99, places=2)

    def test_product_variant_inherits_template(self):
        """product.product inherits from template; create with name creates template."""
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
            p = Product.create({"name": "Widget X", "list_price": 12.50})
            self.assertIsNotNone(p.id if hasattr(p, "id") else (p.ids[0] if p.ids else None))
            row = Product.browse(p.ids[0]).read(["name", "list_price", "product_template_id"])[0]
            self.assertEqual(row.get("name"), "Widget X")
            self.assertAlmostEqual(float(row.get("list_price") or 0), 12.50, places=2)
            tid = row.get("product_template_id")
            if isinstance(tid, (list, tuple)) and tid:
                tid = tid[0]
            self.assertIsNotNone(tid)

    def test_product_with_attributes(self):
        """Create template with attributes, create variant with attribute values."""
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
            Attr = env.get("product.attribute")
            AttrVal = env.get("product.attribute.value")
            Template = env.get("product.template")
            TemplateLine = env.get("product.template.attribute.line")
            Product = env.get("product.product")
            if not all([Attr, AttrVal, Template, TemplateLine, Product]):
                self.skipTest("Required models not loaded")
            size_attr = Attr.create({"name": "Size"})
            for v in ["S", "M", "L"]:
                AttrVal.create({"name": v, "attribute_id": size_attr.id})
            sizes = AttrVal.search([("attribute_id", "=", size_attr.id)])
            size_ids = sizes.ids if hasattr(sizes, "ids") else [r for r in sizes]
            t = Template.create({"name": "Shirt", "list_price": 25.0})
            TemplateLine.create({
                "template_id": t.id,
                "attribute_id": size_attr.id,
                "value_ids": [(6, 0, size_ids)],
            })
            m_val_id = None
            for vid in size_ids:
                r = AttrVal.browse(vid).read(["name"])
                if r and r[0].get("name") == "M":
                    m_val_id = vid
                    break
            m_val_id = m_val_id or size_ids[0]
            p = Product.create({
                "product_template_id": t.id,
                "attribute_value_ids": [(6, 0, [m_val_id])],
            })
            self.assertIsNotNone(p.id if hasattr(p, "id") else (p.ids[0] if p.ids else None))
            row = Product.browse(p.ids[0]).read(["name", "attribute_value_ids"])[0]
            self.assertIn("Shirt", str(row.get("name", "")))
            self.assertTrue(row.get("attribute_value_ids"))
