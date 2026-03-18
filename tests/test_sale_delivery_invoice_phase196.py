"""Phase 196: Sale Order -> Delivery -> Invoice workflow."""

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


class TestSaleDeliveryInvoicePhase196(unittest.TestCase):
    """Test SO -> picking -> deliver -> invoice from delivered qty."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_confirm_creates_picking_with_sale_id(self):
        """Confirm SO creates picking with sale_id and delivery_status."""
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
            SaleOrder = env.get("sale.order")
            SaleLine = env.get("sale.order.line")
            Picking = env.get("stock.picking")
            Partner = env.get("res.partner")
            Product = env.get("product.product")
            if not all([SaleOrder, SaleLine, Picking, Partner, Product]):
                self.skipTest("Models not loaded")
            partner = Partner.search([], limit=1)
            product = Product.search([], limit=1)
            if not partner.ids or not product.ids:
                self.skipTest("Need partner and product")
            order_name = "SO/P196-" + str(uuid.uuid4())[:8]
            order = SaleOrder.create({
                "name": order_name,
                "partner_id": partner.ids[0],
                "state": "draft",
            })
            SaleLine.create({
                "order_id": order.ids[0],
                "product_id": product.ids[0],
                "product_uom_qty": 3.0,
                "price_unit": 10.0,
            })
            order.action_confirm()
            pickings = Picking.search([("origin", "=", order_name)])
            if not pickings.ids:
                pickings = Picking.search([("sale_id", "=", order.ids[0])])
            self.assertEqual(len(pickings.ids), 1, "Picking should be created on SO confirm")
            if hasattr(Picking, "sale_id"):
                sid = pickings.read(["sale_id"])[0].get("sale_id")
                sid = sid[0] if isinstance(sid, (list, tuple)) and sid else sid
                self.assertEqual(sid, order.ids[0], "Picking should link to sale order")
            order_row = order.read(["delivery_status"])[0]
            self.assertIn(order_row.get("delivery_status"), ("no", "partial", "full"))

    def test_invoice_from_delivered_qty(self):
        """Validate picking, then create invoice from delivered qty only."""
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
            SaleOrder = env.get("sale.order")
            SaleLine = env.get("sale.order.line")
            Picking = env.get("stock.picking")
            Move = env.get("stock.move")
            AccountMove = env.get("account.move")
            MoveLine = env.get("account.move.line")
            Partner = env.get("res.partner")
            Product = env.get("product.product")
            if not all([SaleOrder, SaleLine, Picking, Move, AccountMove, MoveLine, Partner, Product]):
                self.skipTest("Models not loaded")
            order_name = "SO/D196-" + str(uuid.uuid4())[:8]
            partner = Partner.create({"name": "Phase196 Deliver Test"})
            product = Product.create({"name": "Deliver Product", "list_price": 20.0})
            order = SaleOrder.create({
                "name": order_name,
                "partner_id": partner.ids[0],
                "state": "draft",
            })
            SaleLine.create({
                "order_id": order.ids[0],
                "product_id": product.ids[0],
                "product_uom_qty": 5.0,
                "price_unit": 20.0,
            })
            order.action_confirm()
            pickings = Picking.search([("origin", "=", order_name)])
            if not pickings.ids:
                pickings = Picking.search([("sale_id", "=", order.ids[0])])
            self.assertEqual(len(pickings.ids), 1, "Picking should be created")
            picking = Picking.browse(pickings.ids[0])
            picking.action_confirm()
            order._update_delivery_status()
            delivered = order._get_delivered_qty_by_product()
            pid = product.ids[0]
            self.assertIn(pid, delivered, f"Delivered should include product {pid}: {delivered}")
            self.assertEqual(delivered[pid], 5.0)
            picking.action_create_invoice()
            invs = AccountMove.search([("invoice_origin", "=", order_name), ("move_type", "=", "out_invoice")])
            self.assertEqual(len(invs.ids), 1)
            lines = MoveLine.search([("move_id", "=", invs.ids[0]), ("credit", ">", 0)])
            total = sum(r.get("credit", 0) for r in lines.read(["credit"]))
            self.assertAlmostEqual(total, 100.0, places=2)
