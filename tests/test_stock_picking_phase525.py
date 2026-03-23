"""Phase 525: stock.picking assign/validate and quants (incoming + outgoing)."""

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


class TestStockPickingPhase525(unittest.TestCase):
    db = "_test_rpc_read"
    _addons_path = str((Path(__file__).resolve().parent.parent / "addons").resolve())

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=" + cls._addons_path])
        cls._has_db = db_exists(cls.db)

    def test_incoming_validate_increments_dest_quant(self):
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
            if not all([Picking, Move, Quant, Pt, Product]):
                self.skipTest("models missing")
            inc = Pt.search([("code", "=", "incoming")], limit=1)
            if not inc.ids:
                self.skipTest("no incoming picking type")
            ptr = Pt.browse(inc.ids[0]).read(["default_location_src_id", "default_location_dest_id"])[0]
            src_id = ptr.get("default_location_src_id")
            dst_id = ptr.get("default_location_dest_id")
            if isinstance(src_id, (list, tuple)) and src_id:
                src_id = src_id[0]
            if isinstance(dst_id, (list, tuple)) and dst_id:
                dst_id = dst_id[0]
            if not src_id or not dst_id:
                self.skipTest("picking type locations missing")
            prod = Product.create({"name": "P525-" + uuid.uuid4().hex[:6]})
            pid = prod.ids[0]
            before = Quant.search([("product_id", "=", pid), ("location_id", "=", dst_id)])
            bqty = 0.0
            if before.ids:
                bqty = float(before.read(["quantity"])[0].get("quantity") or 0)
            IrSequence = env.get("ir.sequence")
            next_val = IrSequence.next_by_code("stock.picking") if IrSequence else None
            name = f"IN/P525/{next_val}" if next_val is not None else "New"
            pick = Picking.create({
                "name": name,
                "picking_type_id": inc.ids[0],
                "location_id": src_id,
                "location_dest_id": dst_id,
                "state": "draft",
            })
            Move.create({
                "name": "recv",
                "product_id": pid,
                "product_uom_qty": 4.0,
                "picking_id": pick.ids[0],
                "location_id": src_id,
                "location_dest_id": dst_id,
                "state": "draft",
            })
            pick.action_validate()
            after = Quant.search([("product_id", "=", pid), ("location_id", "=", dst_id)], limit=1)
            self.assertTrue(after.ids, "quant should exist at dest after incoming validate")
            aq = float(after.read(["quantity"])[0].get("quantity") or 0)
            self.assertAlmostEqual(aq, bqty + 4.0, places=5)
            pst = pick.read(["state"])[0].get("state")
            self.assertEqual(pst, "done")
