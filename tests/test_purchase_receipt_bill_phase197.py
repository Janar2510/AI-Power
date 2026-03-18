"""Phase 197: Purchase Order -> Receipt -> Vendor Bill workflow."""

import unittest
import uuid

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


class TestPurchaseReceiptBillPhase197(unittest.TestCase):
    """Test PO -> picking -> receive -> bill from received qty."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_confirm_creates_picking_with_purchase_id(self):
        """Confirm PO creates picking with purchase_id and bill_status."""
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
            PurchaseOrder = env.get("purchase.order")
            PoLine = env.get("purchase.order.line")
            Picking = env.get("stock.picking")
            Partner = env.get("res.partner")
            Product = env.get("product.product")
            if not all([PurchaseOrder, PoLine, Picking, Partner, Product]):
                self.skipTest("Models not loaded")
            partner = Partner.search([], limit=1)
            product = Product.search([], limit=1)
            if not partner.ids or not product.ids:
                self.skipTest("Need partner and product")
            order_name = "PO/P197-" + str(uuid.uuid4())[:8]
            order = PurchaseOrder.create({
                "name": order_name,
                "partner_id": partner.ids[0],
                "state": "draft",
            })
            PoLine.create({
                "order_id": order.ids[0],
                "product_id": product.ids[0],
                "product_qty": 3.0,
                "price_unit": 10.0,
            })
            order.button_confirm()
            pickings = Picking.search([("origin", "=", order_name)])
            if not pickings.ids:
                pickings = Picking.search([("purchase_id", "=", order.ids[0])])
            self.assertEqual(len(pickings.ids), 1, "Picking should be created on PO confirm")
            if hasattr(Picking, "purchase_id"):
                pid = pickings.read(["purchase_id"])[0].get("purchase_id")
                pid = pid[0] if isinstance(pid, (list, tuple)) and pid else pid
                self.assertEqual(pid, order.ids[0], "Picking should link to purchase order")
            order_row = order.read(["bill_status"])[0]
            self.assertIn(order_row.get("bill_status"), ("no", "partial", "full"))

    def test_bill_from_received_qty(self):
        """Validate picking, then create vendor bill from received qty only."""
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
            PurchaseOrder = env.get("purchase.order")
            PoLine = env.get("purchase.order.line")
            Picking = env.get("stock.picking")
            Move = env.get("stock.move")
            AccountMove = env.get("account.move")
            MoveLine = env.get("account.move.line")
            Partner = env.get("res.partner")
            Product = env.get("product.product")
            if not all([PurchaseOrder, PoLine, Picking, Move, AccountMove, MoveLine, Partner, Product]):
                self.skipTest("Models not loaded")
            order_name = "PO/B197-" + str(uuid.uuid4())[:8]
            partner = Partner.create({"name": "Phase197 Bill Test"})
            product = Product.create({"name": "Bill Product", "list_price": 20.0})
            order = PurchaseOrder.create({
                "name": order_name,
                "partner_id": partner.ids[0],
                "state": "draft",
            })
            PoLine.create({
                "order_id": order.ids[0],
                "product_id": product.ids[0],
                "product_qty": 5.0,
                "price_unit": 20.0,
            })
            order.button_confirm()
            pickings = Picking.search([("origin", "=", order_name)])
            if not pickings.ids:
                pickings = Picking.search([("purchase_id", "=", order.ids[0])])
            self.assertEqual(len(pickings.ids), 1, "Picking should be created")
            picking = Picking.browse(pickings.ids[0])
            picking.action_confirm()
            order._update_bill_status()
            received = order._get_received_qty_by_product()
            pid = product.ids[0]
            self.assertIn(pid, received, f"Received should include product {pid}: {received}")
            self.assertEqual(received[pid], 5.0)
            picking.action_create_bill()
            invs = AccountMove.search([("invoice_origin", "=", order_name), ("move_type", "=", "in_invoice")])
            self.assertEqual(len(invs.ids), 1)
            lines = MoveLine.search([("move_id", "=", invs.ids[0]), ("debit", ">", 0)])
            total = sum(r.get("debit", 0) for r in lines.read(["debit"]))
            self.assertAlmostEqual(total, 100.0, places=2)
