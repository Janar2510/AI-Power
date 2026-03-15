"""Phase 116: Stock module - sale order confirm creates delivery picking."""

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


class TestStockPhase116(unittest.TestCase):
    """Test stock pickings created from sale order confirm."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_sale_order_confirm_creates_picking(self):
        """Create SO, confirm, verify stock.picking created with moves."""
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
            Partner = env.get("res.partner")
            Product = env.get("product.product")
            SaleOrder = env.get("sale.order")
            SaleLine = env.get("sale.order.line")
            Picking = env.get("stock.picking")
            Move = env.get("stock.move")
            missing = [n for n, m in [
                ("Partner", Partner), ("Product", Product), ("SaleOrder", SaleOrder),
                ("SaleLine", SaleLine), ("Picking", Picking), ("Move", Move),
            ] if m is None]
            if missing:
                self.skipTest(f"Required models not loaded: {missing}")
            partner = Partner.search([], limit=1)
            if not partner.ids:
                partner = Partner.create({"name": "Stock Test Partner", "email": "stock@test.com"})
            product = Product.search([], limit=1)
            if not product.ids:
                product = Product.create({"name": "Test Product", "list_price": 10.0})
            import uuid
            order_name = "S-" + str(uuid.uuid4())[:8]
            order = SaleOrder.create({
                "name": order_name,
                "partner_id": partner.ids[0],
                "state": "draft",
            })
            SaleLine.create({
                "order_id": order.ids[0],
                "product_id": product.ids[0],
                "product_uom_qty": 2.0,
                "price_unit": 10.0,
            })
            order.action_confirm()
            pickings = Picking.search([("origin", "=", order_name)])
            self.assertGreater(
                len(pickings.ids), 0,
                "Picking should be created from SO confirm",
            )
            picking_id = pickings.ids[0]
            moves = Move.search([("picking_id", "=", picking_id)])
            self.assertGreater(len(moves.ids), 0, "Picking should have moves")
            move_row = moves.read(["product_id", "product_uom_qty"])[0]
            self.assertEqual(move_row.get("product_uom_qty"), 2.0)

    def test_create_picking_directly(self):
        """Create picking directly to verify stock module works."""
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
            Picking = env.get("stock.picking")
            PickingType = env.get("stock.picking.type")
            if not Picking or not PickingType:
                self.skipTest("Stock module not loaded")
            out = PickingType.search([("code", "=", "outgoing")], limit=1)
            if not out.ids:
                self.skipTest("No outgoing picking type")
            rec = PickingType.browse(out.ids[0]).read(["default_location_src_id", "default_location_dest_id"])
            src = rec[0].get("default_location_src_id")
            dest = rec[0].get("default_location_dest_id")
            if not src or not dest:
                self.skipTest("Picking type missing locations")
            p = Picking.create({
                "name": "OUT/TEST",
                "picking_type_id": out.ids[0],
                "location_id": src,
                "location_dest_id": dest,
                "origin": "TEST",
                "state": "draft",
            })
            self.assertGreater(len(p.ids), 0)
            found = Picking.search([("origin", "=", "TEST")])
            self.assertGreater(len(found.ids), 0)
