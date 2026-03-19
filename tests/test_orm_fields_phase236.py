"""Phase 236: Field types - Reference, Json, Properties, Html, Many2oneReference."""

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


class TestOrmFieldsPhase236(unittest.TestCase):
    """Test Reference, Json, Properties, Html, Many2oneReference field types."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_orm_fields_236"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_field_types_exist(self):
        """Reference, Json, Properties, Html, Many2oneReference exist in fields."""
        from core.orm import fields
        self.assertTrue(hasattr(fields, "Reference"))
        self.assertTrue(hasattr(fields, "Json"))
        self.assertTrue(hasattr(fields, "Properties"))
        self.assertTrue(hasattr(fields, "Html"))
        self.assertTrue(hasattr(fields, "Many2oneReference"))

    def test_base_field_test_model(self):
        """base.field.test model exists and has Phase 236 fields."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_orm_fields_236")
        with get_cursor(self.db) as cr:
            env = _setup_env(self.db, self._addons_path, cr)
            Model = env.get("base.field.test")
            if not Model:
                self.skipTest("base.field.test not found")
            self.assertTrue(hasattr(Model, "ref_field"))
            self.assertTrue(hasattr(Model, "json_field"))
            self.assertTrue(hasattr(Model, "props_field"))
            self.assertTrue(hasattr(Model, "html_field"))

    def test_reference_json_properties_html_crud(self):
        """Create, read, write Reference, Json, Properties, Html."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_orm_fields_236")
        with get_cursor(self.db) as cr:
            env = _setup_env(self.db, self._addons_path, cr)
            Model = env.get("base.field.test")
            if not Model:
                self.skipTest("base.field.test not found")
            rec = Model.create({
                "name": "Phase236 Test",
                "ref_field": "res.partner,1",
                "json_field": {"key": "value", "nested": {"a": 1}},
                "props_field": {"color": "red", "size": 42},
                "html_field": "<p>Hello <b>World</b></p>",
            })
            self.assertIsNotNone(rec)
            self.assertIsNotNone(rec.id)
            rows = rec.read(["name", "ref_field", "json_field", "props_field", "html_field"])
            self.assertEqual(len(rows), 1)
            r = rows[0]
            self.assertEqual(r["name"], "Phase236 Test")
            self.assertEqual(r["ref_field"], "res.partner,1")
            self.assertEqual(r["json_field"], {"key": "value", "nested": {"a": 1}})
            self.assertEqual(r["props_field"], {"color": "red", "size": 42})
            self.assertIn("Hello", r.get("html_field", "") or "")
            self.assertIn("World", r.get("html_field", "") or "")

    def test_many2one_reference_crud(self):
        """Create, read Many2oneReference with res_model discriminator."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_orm_fields_236")
        with get_cursor(self.db) as cr:
            env = _setup_env(self.db, self._addons_path, cr)
            Model = env.get("base.field.test")
            Partner = env.get("res.partner")
            if not Model or not Partner:
                self.skipTest("base.field.test or res.partner not found")
            partner = Partner.search([], limit=1)
            if not partner.ids:
                partner = Partner.create({"name": "M2ORef Partner"})
            rec = Model.create({
                "name": "M2ORef Test",
                "res_model": "res.partner",
                "m2o_ref_id": partner.id,
            })
            self.assertIsNotNone(rec)
            rows = rec.read(["res_model", "m2o_ref_id"])
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0]["res_model"], "res.partner")
            self.assertEqual(rows[0]["m2o_ref_id"], partner.id)
