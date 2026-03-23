"""Phase 526: BOM operations create one work order per routing step."""

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


class TestMrpBomOperationsPhase526(unittest.TestCase):
    """BOM with mrp.bom.operation rows yields matching mrp.workorder rows on MO confirm."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_confirm_creates_workorder_per_operation(self):
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
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Production = env.get("mrp.production")
            Bom = env.get("mrp.bom")
            BomLine = env.get("mrp.bom.line")
            Op = env.get("mrp.bom.operation")
            Wc = env.get("mrp.workcenter")
            Wo = env.get("mrp.workorder")
            Product = env.get("product.product")
            if not all([Production, Bom, BomLine, Op, Wc, Wo, Product]):
                self.skipTest("Required MRP models not loaded")
            products = Product.search_read([], ["id"], limit=2)
            if len(products) < 2:
                Product.create({"name": "Raw Op", "list_price": 1.0})
                Product.create({"name": "Fin Op", "list_price": 5.0})
                products = Product.search_read([], ["id"], limit=2)
            raw_id = products[0]["id"]
            finished_id = products[1]["id"]
            wc = Wc.create({"name": "WC526"})
            bom = Bom.create(
                {
                    "name": "BOM Ops 526",
                    "product_id": finished_id,
                    "product_qty": 1.0,
                }
            )
            BomLine.create({"bom_id": bom.id, "product_id": raw_id, "product_qty": 1.0})
            Op.create({"bom_id": bom.id, "name": "Cut", "sequence": 10, "workcenter_id": wc.id})
            Op.create({"bom_id": bom.id, "name": "Assemble", "sequence": 20, "workcenter_id": wc.id})
            mo = Production.create(
                {
                    "product_id": finished_id,
                    "bom_id": bom.id,
                    "product_qty": 1.0,
                    "state": "draft",
                }
            )
            mo.action_confirm()
            wos = Wo.search([("production_id", "=", mo.id)])
            self.assertEqual(len(wos.ids), 2, "expected one work order per BOM operation")
            names = sorted(
                Wo.browse(wid).read(["name"])[0].get("name") or "" for wid in wos.ids
            )
            self.assertEqual(names, ["Assemble", "Cut"])

    def test_cost_estimate_uses_bom_lines(self):
        """mrp_account cost_estimate sums BOM × standard_price."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found")
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
            Production = env.get("mrp.production")
            Bom = env.get("mrp.bom")
            BomLine = env.get("mrp.bom.line")
            Product = env.get("product.product")
            Template = env.get("product.template")
            if not all([Production, Bom, BomLine, Product, Template]):
                self.skipTest("Required models not loaded")
            raw_rec = Product.create({"name": "Raw CE 526x", "list_price": 1.0})
            fin_rec = Product.create({"name": "Fin CE 526x", "list_price": 5.0})
            raw_id = raw_rec.id
            fin_id = fin_rec.id

            def _tmpl_id(pid):
                ref = Product.browse(pid).read(["product_template_id"])[0].get("product_template_id")
                if isinstance(ref, (list, tuple)) and ref:
                    return ref[0]
                return ref

            tid_raw = _tmpl_id(raw_id)
            tid_fin = _tmpl_id(fin_id)
            if not tid_raw or not tid_fin:
                self.skipTest("product.template not linked after product.product create")
            Template.browse(tid_raw).write({"standard_price": 3.0})
            Template.browse(tid_fin).write({"standard_price": 100.0})
            bom = Bom.create(
                {
                    "name": "BOM Cost 526",
                    "product_id": fin_id,
                    "product_qty": 1.0,
                }
            )
            BomLine.create({"bom_id": bom.id, "product_id": raw_id, "product_qty": 2.0})
            mo = Production.create(
                {
                    "product_id": fin_id,
                    "bom_id": bom.id,
                    "product_qty": 2.0,
                    "state": "draft",
                }
            )
            row = mo.read(["cost_estimate"])[0]
            ce = row.get("cost_estimate")
            if ce is None:
                self.skipTest("mrp_account not loaded — no cost_estimate field")
            # 2 (MO qty) * 2 (line qty) * 3 (standard_price) = 12
            self.assertAlmostEqual(float(ce), 12.0, places=5)
