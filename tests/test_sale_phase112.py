"""Phase 112: Minimal Sales module - sale.order, sale.order.line, product.product."""

import unittest

from core.tools.config import parse_config
from core.modules import load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


def _ensure_test_db(dbname: str) -> bool:
    parse_config(["--addons-path=addons"])
    return db_exists(dbname)


class TestSalePhase112(unittest.TestCase):
    """Phase 112: sale.order, sale.order.line, product.product."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)

    def test_sale_order_create_with_lines(self):
        """Create sale order with order lines; amount_total computed."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Partner = env.get("res.partner")
            Product = env.get("product.product")
            SaleOrder = env.get("sale.order")
            SaleOrderLine = env.get("sale.order.line")
            if not all([Partner, Product, SaleOrder, SaleOrderLine]):
                self.skipTest("Sale module not loaded")
            partner = Partner.search([], limit=1)
            if not partner or not partner.ids:
                partner = Partner.create({"name": "Test Customer", "email": "cust@test.com"})
            else:
                partner = partner[0]
            partner_id = partner.ids[0] if partner.ids else partner.id
            product = Product.create({"name": "Widget A", "list_price": 10.0})
            product_id = product.ids[0] if product.ids else product.id
            order = SaleOrder.create({
                "name": "SO-TEST-001",
                "partner_id": partner_id,
                "state": "draft",
            })
            self.assertIsNotNone(order.ids or getattr(order, "id", None))
            order_id = order.ids[0] if order.ids else order.id
            SaleOrderLine.create({
                "order_id": order_id,
                "product_id": product_id,
                "name": "Widget A",
                "product_uom_qty": 2.0,
                "price_unit": 10.0,
            })
            SaleOrderLine.create({
                "order_id": order_id,
                "product_id": product_id,
                "name": "Widget A",
                "product_uom_qty": 1.0,
                "price_unit": 5.0,
            })
            rows = SaleOrder.browse([order_id]).read(["amount_total"])
            total = rows[0].get("amount_total", 0)
            self.assertEqual(total, 25.0, "amount_total should be 2*10 + 1*5 = 25")

    def test_sale_order_action_confirm(self):
        """action_confirm sets state to sale."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Partner = env.get("res.partner")
            SaleOrder = env.get("sale.order")
            if not Partner or not SaleOrder:
                self.skipTest("Sale module not loaded")
            partner = Partner.search([], limit=1)
            if not partner or not partner.ids:
                partner = Partner.create({"name": "Confirm Test", "email": "c@test.com"})
            order = SaleOrder.create({
                "name": "SO-CONFIRM",
                "partner_id": partner.ids[0],
                "state": "draft",
            })
            order_id = order.ids[0]
            SaleOrder.browse([order_id]).action_confirm()
            rows = SaleOrder.browse([order_id]).read(["state"])
            self.assertEqual(rows[0].get("state"), "sale")
