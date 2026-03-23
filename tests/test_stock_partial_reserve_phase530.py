"""Phase 530: partial reservation on assign; validate ships reserved qty only."""

import unittest
import uuid
from pathlib import Path

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from core.orm.models import ModelBase


class TestStockPartialReservePhase530(unittest.TestCase):
    db = "_test_rpc_read"
    _addons_path = str((Path(__file__).resolve().parent.parent / "addons").resolve())

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=" + cls._addons_path])
        cls._has_db = db_exists(cls.db)

    def test_partial_assign_then_validate_ship_reserved(self):
        if not self._has_db:
            self.skipTest("DB not found")
        parse_config(["--addons-path=" + self._addons_path])
        registry = Registry(self.db)
        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Picking = env.get("stock.picking")
            Move = env.get("stock.move")
            Quant = env.get("stock.quant")
            Pt = env.get("stock.picking.type")
            Product = env.get("product.product")
            Location = env.get("stock.location")
            if not all([Picking, Move, Quant, Pt, Product, Location]):
                self.skipTest("models missing")
            out = Pt.search([("code", "=", "outgoing")], limit=1)
            if not out.ids:
                self.skipTest("no outgoing picking type")
            ptr = Pt.browse(out.ids[0]).read(["default_location_src_id", "default_location_dest_id"])[0]
            src_id = ptr.get("default_location_src_id")
            cust_id = ptr.get("default_location_dest_id")
            if isinstance(src_id, (list, tuple)) and src_id:
                src_id = src_id[0]
            if isinstance(cust_id, (list, tuple)) and cust_id:
                cust_id = cust_id[0]
            if not src_id or not cust_id:
                self.skipTest("picking type locations missing")
            src_type = Location.browse(src_id).read(["type"])[0].get("type")
            if src_type != "internal":
                self.skipTest("outgoing default source must be internal for this test")
            prod = Product.create({"name": "P530-" + uuid.uuid4().hex[:6]})
            pid = prod.ids[0]
            Quant.create(
                {
                    "product_id": pid,
                    "location_id": src_id,
                    "quantity": 2.0,
                    "reserved_quantity": 0.0,
                }
            )
            IrSequence = env.get("ir.sequence")
            next_val = IrSequence.next_by_code("stock.picking") if IrSequence else None
            name = f"OUT/P530/{next_val}" if next_val is not None else "New"
            pick = Picking.create(
                {
                    "name": name,
                    "picking_type_id": out.ids[0],
                    "location_id": src_id,
                    "location_dest_id": cust_id,
                    "state": "draft",
                }
            )
            Move.create(
                {
                    "name": "ship",
                    "product_id": pid,
                    "product_uom_qty": 5.0,
                    "picking_id": pick.ids[0],
                    "location_id": src_id,
                    "location_dest_id": cust_id,
                    "state": "draft",
                }
            )
            pick.action_assign()
            mids = pick.read(["move_ids"])[0].get("move_ids") or []
            if mids and isinstance(mids[0], (list, tuple)):
                mids = [x[0] for x in mids if x]
            self.assertTrue(mids)
            mv = Move.browse(mids[0]).read(["state", "quantity_reserved", "product_uom_qty"])[0]
            self.assertEqual(mv.get("state"), "partial")
            self.assertAlmostEqual(float(mv.get("quantity_reserved") or 0), 2.0, places=5)
            pst = pick.read(["state"])[0].get("state")
            self.assertEqual(pst, "assigned")
            pick.action_validate()
            mv2 = Move.browse(mids[0]).read(["state", "product_uom_qty"])[0]
            self.assertEqual(mv2.get("state"), "done")
            self.assertAlmostEqual(float(mv2.get("product_uom_qty") or 0), 2.0, places=5)
            qrest = Quant.search([("product_id", "=", pid), ("location_id", "=", src_id)], limit=1)
            if qrest.ids:
                qq = float(qrest.read(["quantity"])[0].get("quantity") or 0)
                self.assertAlmostEqual(qq, 0.0, places=5)
