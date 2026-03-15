"""Phase 117: Purchase module - purchase order confirm creates incoming stock.picking."""

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


class TestPurchasePhase117(unittest.TestCase):
    """Test stock pickings created from purchase order confirm."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_purchase_order_confirm_creates_picking(self):
        """Create PO, confirm, verify stock.picking (incoming) created with moves."""
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
            PurchaseOrder = env.get("purchase.order")
            PoLine = env.get("purchase.order.line")
            Picking = env.get("stock.picking")
            Move = env.get("stock.move")
            missing = [n for n, m in [
                ("Partner", Partner), ("Product", Product), ("PurchaseOrder", PurchaseOrder),
                ("PoLine", PoLine), ("Picking", Picking), ("Move", Move),
            ] if m is None]
            if missing:
                self.skipTest(f"Required models not loaded: {missing}")
            partner = Partner.search([], limit=1)
            if not partner.ids:
                partner = Partner.create({"name": "Purchase Test Vendor", "email": "vendor@test.com"})
            product = Product.search([], limit=1)
            if not product.ids:
                product = Product.create({"name": "Test Product", "list_price": 10.0})
            import uuid
            order_name = "PO-" + str(uuid.uuid4())[:8]
            order = PurchaseOrder.create({
                "name": order_name,
                "partner_id": partner.ids[0],
                "state": "draft",
            })
            PoLine.create({
                "order_id": order.ids[0],
                "product_id": product.ids[0],
                "product_qty": 3.0,
                "price_unit": 5.0,
            })
            order.button_confirm()
            pickings = Picking.search([("origin", "=", order_name)])
            self.assertGreater(
                len(pickings.ids), 0,
                "Picking should be created from PO confirm",
            )
            picking_id = pickings.ids[0]
            moves = Move.search([("picking_id", "=", picking_id)])
            self.assertGreater(len(moves.ids), 0, "Picking should have moves")
            move_row = moves.read(["product_id", "product_uom_qty"])[0]
            self.assertEqual(move_row.get("product_uom_qty"), 3.0)
