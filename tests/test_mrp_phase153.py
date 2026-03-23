"""Phase 153: MRP module - BOM, production orders, work centers."""

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


class TestMrpPhase153(unittest.TestCase):
    """Test MRP module: BOM, production order workflow, stock integration."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_mrp_bom_create(self):
        """Create BOM with lines."""
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
            Bom = env.get("mrp.bom")
            BomLine = env.get("mrp.bom.line")
            Product = env.get("product.product")
            if not all([Bom, BomLine, Product]):
                self.skipTest("Required models not loaded: mrp.bom, mrp.bom.line, product.product")
            products = Product.search_read([], ["id"], limit=3)
            if len(products) < 2:
                Product.create({"name": "Component A", "list_price": 1.0})
                Product.create({"name": "Component B", "list_price": 2.0})
                Product.create({"name": "Finished Product", "list_price": 10.0})
            products = Product.search_read([], ["id"], limit=3)
            self.assertGreaterEqual(len(products), 2)
            finished_id = products[0]["id"]
            comp_id = products[1]["id"]
            bom = Bom.create({
                "name": "BOM Test",
                "product_id": finished_id,
                "product_qty": 1.0,
                "type": "normal",
            })
            self.assertIsNotNone(bom.id)
            BomLine.create({
                "bom_id": bom.id,
                "product_id": comp_id,
                "product_qty": 2.0,
            })
            data = bom.read(["bom_line_ids"])
            self.assertTrue(data[0].get("bom_line_ids"))

    def test_mrp_production_workflow(self):
        """Create MO, confirm, start, done - verify moves and state."""
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
            Product = env.get("product.product")
            Move = env.get("stock.move")
            if not all([Production, Bom, Product, Move]):
                self.skipTest("Required models not loaded")
            products = Product.search_read([], ["id"], limit=2)
            if len(products) < 2:
                Product.create({"name": "Raw", "list_price": 1.0})
                Product.create({"name": "Finished", "list_price": 5.0})
                products = Product.search_read([], ["id"], limit=2)
            raw_id = products[0]["id"]
            finished_id = products[1]["id"]
            bom = Bom.create({
                "name": "BOM Test",
                "product_id": finished_id,
                "product_qty": 1.0,
            })
            BomLine = env.get("mrp.bom.line")
            BomLine.create({"bom_id": bom.id, "product_id": raw_id, "product_qty": 1.0})
            mo = Production.create({
                "product_id": finished_id,
                "bom_id": bom.id,
                "product_qty": 1.0,
                "state": "draft",
            })
            self.assertIsNotNone(mo.id)
            mo_name = mo.read(["name"])[0].get("name") or ""
            self.assertGreater(len(mo_name), 0)
            self.assertEqual(mo.read(["state"])[0]["state"], "draft")
            mo.action_confirm()
            self.assertEqual(mo.read(["state"])[0]["state"], "confirmed")
            moves = mo.read(["move_ids"])[0].get("move_ids") or []
            move_ids = [x[0] if isinstance(x, (list, tuple)) else x for x in moves if x]
            self.assertGreater(len(move_ids), 0)
            mo.action_start()
            self.assertEqual(mo.read(["state"])[0]["state"], "progress")
            mo.action_done()
            self.assertEqual(mo.read(["state"])[0]["state"], "done")
            for mid in move_ids:
                m = Move.browse(mid).read(["state"])[0]
                self.assertEqual(m["state"], "done")

    def test_mrp_cancel_cancels_open_moves(self):
        """After confirm, cancel MO should set linked moves to cancel (Phase 489)."""
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
            Product = env.get("product.product")
            Move = env.get("stock.move")
            BomLine = env.get("mrp.bom.line")
            if not all([Production, Bom, Product, Move, BomLine]):
                self.skipTest("Required models not loaded")
            products = Product.search_read([], ["id"], limit=2)
            if len(products) < 2:
                Product.create({"name": "Raw C", "list_price": 1.0})
                Product.create({"name": "Fin C", "list_price": 5.0})
                products = Product.search_read([], ["id"], limit=2)
            raw_id = products[0]["id"]
            finished_id = products[1]["id"]
            bom = Bom.create({
                "name": "BOM Cancel Test",
                "product_id": finished_id,
                "product_qty": 1.0,
            })
            BomLine.create({"bom_id": bom.id, "product_id": raw_id, "product_qty": 1.0})
            mo = Production.create({
                "product_id": finished_id,
                "bom_id": bom.id,
                "product_qty": 1.0,
                "state": "draft",
            })
            mo.action_confirm()
            self.assertEqual(mo.read(["state"])[0]["state"], "confirmed")
            moves = mo.read(["move_ids"])[0].get("move_ids") or []
            move_ids = [x[0] if isinstance(x, (list, tuple)) else x for x in moves if x]
            self.assertGreater(len(move_ids), 0)
            mo.action_cancel()
            self.assertEqual(mo.read(["state"])[0]["state"], "cancel")
            for mid in move_ids:
                st = Move.browse(mid).read(["state"])[0].get("state")
                self.assertEqual(st, "cancel", f"move {mid} should be cancelled")
