"""Phase 189: Inventory Reordering Rules - stock.warehouse.orderpoint, _procure_orderpoint_confirm."""

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


class TestOrderpointPhase189(unittest.TestCase):
    """Test stock.warehouse.orderpoint and _procure_orderpoint_confirm."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_orderpoint_create_stock_move(self):
        """Orderpoint below min creates stock.move when no vendor."""
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
            Orderpoint = env.get("stock.warehouse.orderpoint")
            Product = env.get("product.product")
            Location = env.get("stock.location")
            Quant = env.get("stock.quant")
            Move = env.get("stock.move")
            if not all([Orderpoint, Product, Location, Quant, Move]):
                self.skipTest("Models not loaded")
            prod = Product.create({"name": "Orderpoint Test", "list_price": 5.0})
            pid = prod.ids[0] if prod.ids else prod.id
            stock_loc = Location.search([("type", "=", "internal")], limit=1)
            loc_id = stock_loc.ids[0] if stock_loc.ids else None
            if not loc_id:
                self.skipTest("No internal location")
            op = Orderpoint.create({
                "name": "OP-001",
                "product_id": pid,
                "location_id": loc_id,
                "product_min_qty": 10.0,
                "product_max_qty": 50.0,
                "qty_multiple": 1.0,
            })
            moves_before = Move.search([("product_id", "=", pid)])
            op._procure_orderpoint_confirm()
            moves_after = Move.search([("product_id", "=", pid)])
            self.assertGreater(len(moves_after.ids), len(moves_before.ids), msg="Should create replenishment move")

    def test_orderpoint_above_min_no_action(self):
        """Orderpoint above min does not create move."""
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
            Orderpoint = env.get("stock.warehouse.orderpoint")
            Product = env.get("product.product")
            Location = env.get("stock.location")
            Quant = env.get("stock.quant")
            Move = env.get("stock.move")
            if not all([Orderpoint, Product, Location, Quant, Move]):
                self.skipTest("Models not loaded")
            prod = Product.create({"name": "Orderpoint Test 2", "list_price": 3.0})
            pid = prod.ids[0] if prod.ids else prod.id
            stock_loc = Location.search([("type", "=", "internal")], limit=1)
            loc_id = stock_loc.ids[0] if stock_loc.ids else None
            if not loc_id:
                self.skipTest("No internal location")
            Quant.create({"product_id": pid, "location_id": loc_id, "quantity": 100.0})
            op = Orderpoint.create({
                "name": "OP-002",
                "product_id": pid,
                "location_id": loc_id,
                "product_min_qty": 10.0,
                "product_max_qty": 50.0,
            })
            moves_before = Move.search([("product_id", "=", pid)])
            op._procure_orderpoint_confirm()
            moves_after = Move.search([("product_id", "=", pid)])
            self.assertEqual(len(moves_after.ids), len(moves_before.ids), msg="Should not create move when above min")

    def test_orderpoint_create_purchase_order(self):
        """Orderpoint with partner_id creates purchase.order when below min."""
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
            Orderpoint = env.get("stock.warehouse.orderpoint")
            Product = env.get("product.product")
            Location = env.get("stock.location")
            Partner = env.get("res.partner")
            PurchaseOrder = env.get("purchase.order")
            if not all([Orderpoint, Product, Location, Partner]):
                self.skipTest("Models not loaded")
            if not PurchaseOrder:
                self.skipTest("Purchase module not loaded")
            vendor = Partner.create({"name": "Test Vendor"})
            prod = Product.create({"name": "PO Orderpoint Test", "list_price": 2.0})
            pid = prod.ids[0] if prod.ids else prod.id
            stock_loc = Location.search([("type", "=", "internal")], limit=1)
            loc_id = stock_loc.ids[0] if stock_loc.ids else None
            if not loc_id:
                self.skipTest("No internal location")
            op = Orderpoint.create({
                "name": "OP-PO",
                "product_id": pid,
                "location_id": loc_id,
                "product_min_qty": 5.0,
                "product_max_qty": 20.0,
                "partner_id": vendor.ids[0],
            })
            pos_before = PurchaseOrder.search([("partner_id", "=", vendor.ids[0])])
            op._procure_orderpoint_confirm()
            pos_after = PurchaseOrder.search([("partner_id", "=", vendor.ids[0])])
            self.assertGreater(len(pos_after.ids), len(pos_before.ids), msg="Should create purchase order")
