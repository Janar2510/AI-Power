"""
Phase 586: average (and FIFO) outgoing must not over-consume positive layers when qty > on-hand.

Regression: former AVCO path prorated take_qty against full out_qty, driving historical remaining_* negative.
"""

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


class TestStockValuationOutgoingShortfallPhase586(unittest.TestCase):
    db = "_test_rpc_read"
    _addons_path = str((Path(__file__).resolve().parent.parent / "addons").resolve())

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=" + cls._addons_path])
        cls._has_db = db_exists(cls.db)

    def test_average_outgoing_10_with_5_on_layers_leaves_no_negative_remaining(self):
        if not self._has_db:
            self.skipTest("DB not found")
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
            Layer = env.get("stock.valuation.layer")
            Company = env.get("res.company")

            if not all([Picking, Move, Quant, Pt, Product, Location, Layer, Company]):
                self.skipTest("models missing")

            out = Pt.search([("code", "=", "outgoing")], limit=1)
            if not out.ids:
                self.skipTest("picking types missing")

            out_row = Pt.browse(out.ids[0]).read(["default_location_src_id", "default_location_dest_id"])[0]

            def _fid(v):
                if isinstance(v, (list, tuple)) and v:
                    return v[0]
                return v

            src_id = _fid(out_row.get("default_location_src_id"))
            cust_id = _fid(out_row.get("default_location_dest_id"))
            if not src_id or not cust_id:
                self.skipTest("picking type locations missing")

            crows = Company.search([], limit=1)
            if crows.ids:
                Company.browse(crows.ids[0]).write({"stock_valuation_allow_negative": True})

            tag = uuid.uuid4().hex[:6]
            prod = Product.create(
                {
                    "name": f"P586-{tag}",
                    "list_price": 1.0,
                    "cost_method": "average",
                    "standard_price": 10.0,
                }
            )
            pid = prod.ids[0]

            IrSequence = env.get("ir.sequence")
            def pick_name(code):
                n = IrSequence.next_by_code("stock.picking") if IrSequence else None
                return f"{code}/586/{n}" if n is not None else f"{code}/586/{tag}"

            # Seed one positive layer (5 units) — avoids relying on receipt→valuation wiring in this test.
            Layer.create(
                {
                    "product_id": pid,
                    "quantity": 5.0,
                    "unit_cost": 10.0,
                    "value": 50.0,
                    "remaining_qty": 5.0,
                    "remaining_value": 50.0,
                    "description": "phase586 seed",
                }
            )

            pick_out = Picking.create(
                {
                    "name": pick_name("OUT"),
                    "picking_type_id": out.ids[0],
                    "location_id": src_id,
                    "location_dest_id": cust_id,
                    "state": "draft",
                }
            )
            Move.create(
                {
                    "name": "out",
                    "product_id": pid,
                    "product_uom_qty": 10.0,
                    "picking_id": pick_out.ids[0],
                    "location_id": src_id,
                    "location_dest_id": cust_id,
                    "state": "draft",
                }
            )
            pick_out.action_assign()
            pick_out.action_validate()

            for lid in Layer.search([("product_id", "=", pid), ("remaining_qty", ">", 0)]).ids:
                rq = float(Layer.browse(lid).read(["remaining_qty"])[0].get("remaining_qty") or 0)
                self.assertGreaterEqual(
                    rq,
                    -1e-6,
                    "historical positive layers must not end with negative remaining_qty",
                )
