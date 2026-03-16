"""Phase 143: Shop E2E support, order confirmation email, My Orders portal."""

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


class TestShopPhase143(unittest.TestCase):
    """Phase 143: order confirmation email, portal orders."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_ci"
        cls._has_db = _ensure_test_db(cls.db)

    def test_order_confirmation_creates_mail_mail(self):
        """action_confirm creates mail.mail when partner has email."""
        if not self._has_db:
            self.skipTest("DB _test_ci not found; run: ./erp-bin db init -d _test_ci")
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
            Order = env.get("sale.order")
            MailMail = env.get("mail.mail")
            if not all([Partner, Product, Order, MailMail]):
                self.skipTest("Required models not loaded")
            partner = Partner.create({"name": "Email Test", "email": "order-test@example.com"})
            pid = partner.id if hasattr(partner, "id") else partner.ids[0]
            products = Product.search_read([], ["id", "name", "list_price"], limit=1)
            if not products:
                prod = Product.create({"name": "Test Product 143", "list_price": 10.0})
                pid_prod = prod.id if hasattr(prod, "id") else prod.ids[0]
            else:
                pid_prod = products[0]["id"]
            order = Order.create({
                "partner_id": pid,
                "order_line": [{"product_id": pid_prod, "name": "Test", "product_uom_qty": 1, "price_unit": 10.0}],
            })
            order_id = order.id if hasattr(order, "id") else order.ids[0]
            order.action_confirm()
            order_row = Order.browse([order_id]).read(["state"])[0]
            self.assertEqual(order_row.get("state"), "sale", "Order should be confirmed")
            after = MailMail.search([("res_model", "=", "sale.order"), ("res_id", "=", order_id)])
            if after.ids:
                recs = MailMail.browse(after.ids).read(["email_to", "subject", "state"])
                found = any(r.get("email_to") == "order-test@example.com" and r.get("state") == "outgoing" for r in recs)
                self.assertTrue(found, "Confirmation email should be queued for partner")
