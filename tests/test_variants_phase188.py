"""Phase 188: Full Product Variants - _create_variant_ids() generates combinations."""

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


class TestVariantsPhase188(unittest.TestCase):
    """Test product.template _create_variant_ids generates product.product combinations."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_create_variant_ids_no_attributes(self):
        """Template with no attribute lines gets one variant."""
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
            if not all([Template, Product]):
                self.skipTest("Models not loaded")
            t = Template.create({"name": "Simple Product", "list_price": 10.0})
            tid = t.ids[0] if t.ids else t.id
            variants = Product.search([("product_template_id", "=", tid)])
            self.assertEqual(len(variants.ids), 1)
            row = variants.read(["attribute_value_ids"])[0] if variants.read(["attribute_value_ids"]) else {}
            avids = row.get("attribute_value_ids") or []
            self.assertEqual(len(avids), 0)

    def test_create_variant_ids_with_attributes(self):
        """Template with attribute lines gets one variant per combination."""
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
            Attr = env.get("product.attribute")
            AttrVal = env.get("product.attribute.value")
            LineModel = env.get("product.template.attribute.line")
            if not all([Template, Product, Attr, AttrVal, LineModel]):
                self.skipTest("Models not loaded")
            color = Attr.create({"name": "Color"})
            AttrVal.create({"name": "Red", "attribute_id": color.ids[0]})
            AttrVal.create({"name": "Blue", "attribute_id": color.ids[0]})
            size = Attr.create({"name": "Size"})
            AttrVal.create({"name": "S", "attribute_id": size.ids[0]})
            AttrVal.create({"name": "M", "attribute_id": size.ids[0]})
            red_id = AttrVal.search([("name", "=", "Red")]).ids[0]
            blue_id = AttrVal.search([("name", "=", "Blue")]).ids[0]
            s_id = AttrVal.search([("name", "=", "S")]).ids[0]
            m_id = AttrVal.search([("name", "=", "M")]).ids[0]
            t = Template.create({
                "name": "T-Shirt",
                "list_price": 25.0,
                "attribute_line_ids": [
                    {"attribute_id": color.ids[0], "value_ids": [red_id, blue_id]},
                    {"attribute_id": size.ids[0], "value_ids": [s_id, m_id]},
                ],
            })
            tid = t.ids[0] if t.ids else t.id
            variants = Product.search([("product_template_id", "=", tid)])
            self.assertEqual(len(variants.ids), 4, msg="Expected 4 variants: Red-S, Red-M, Blue-S, Blue-M")

    def test_create_variant_ids_write_updates_variants(self):
        """Updating attribute_line_ids via write triggers _create_variant_ids."""
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
            Attr = env.get("product.attribute")
            AttrVal = env.get("product.attribute.value")
            LineModel = env.get("product.template.attribute.line")
            if not all([Template, Product, Attr, AttrVal, LineModel]):
                self.skipTest("Models not loaded")
            color = Attr.create({"name": "Color2"})
            AttrVal.create({"name": "Green", "attribute_id": color.ids[0]})
            AttrVal.create({"name": "Yellow", "attribute_id": color.ids[0]})
            size = Attr.create({"name": "Size2"})
            AttrVal.create({"name": "S", "attribute_id": size.ids[0]})
            green_id = AttrVal.search([("name", "=", "Green")]).ids[0]
            yellow_id = AttrVal.search([("name", "=", "Yellow")]).ids[0]
            s_id = AttrVal.search([("name", "=", "S")]).ids[0]
            t = Template.create({
                "name": "Widget",
                "list_price": 5.0,
                "attribute_line_ids": [
                    {"attribute_id": color.ids[0], "value_ids": [green_id, yellow_id]},
                    {"attribute_id": size.ids[0], "value_ids": [s_id]},
                ],
            })
            tid = t.ids[0] if t.ids else t.id
            variants = Product.search([("product_template_id", "=", tid)])
            self.assertEqual(len(variants.ids), 2, msg="Green-S, Yellow-S")
            line_color = LineModel.search([("template_id", "=", tid), ("attribute_id", "=", color.ids[0])], limit=1)
            t.write({"attribute_line_ids": [(2, line_color.ids[0])]})
            variants_after = Product.search([("product_template_id", "=", tid)])
            self.assertEqual(len(variants_after.ids), 1, msg="One variant after removing color line")
