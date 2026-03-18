"""Phase 227: Point of Sale - config, session, order, pay, done."""

import unittest
from pathlib import Path

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestPosPhase227(unittest.TestCase):
    """Test POS config, session, order, action_pay, action_done."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_pos_227"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_pos_order_pay_done(self):
        """Create POS config, session, order with lines; pay and done."""
        if not self._has_db:
            self.skipTest("DB not found; run: ./erp-bin db init -d _test_pos_227")
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
            Config = env.get("pos.config")
            Session = env.get("pos.session")
            Order = env.get("pos.order")
            Product = env.get("product.product")
            Journal = env.get("account.journal")
            if not all([Config, Session, Order, Product, Journal]):
                self.skipTest("POS or deps not loaded")
            journal = Journal.search([("type", "=", "bank")], limit=1)
            if not journal.ids:
                journal = Journal.search([], limit=1)
            if not journal.ids:
                self.skipTest("No journal")
            config = Config.create({
                "name": "Main POS",
                "journal_id": journal.ids[0],
            })
            session = Session.create({
                "config_id": config.id,
                "user_id": 1,
                "cash_register_balance_start": 100.0,
                "state": "opened",
            })
            products = Product.search([], limit=2)
            if not products.ids:
                self.skipTest("No products")
            lines_vals = []
            for pid in products.ids[:2]:
                p = Product.browse(pid)
                pr = p.read(["list_price", "name"])[0] if p.read(["list_price", "name"]) else {}
                price = pr.get("list_price", 1.0)
                lines_vals.append({
                    "product_id": pid,
                    "name": pr.get("name", "Product"),
                    "qty": 1.0,
                    "price_unit": price,
                })
            order = Order.create({
                "session_id": session.id,
                "lines": lines_vals,
            })
            self.assertIsNotNone(order.id)
            od = order.read(["state"])[0] if order.read(["state"]) else {}
            self.assertEqual(od.get("state"), "draft")
            order.action_pay()
            data = order.read(["state", "payment_amount"])
            self.assertEqual(data[0].get("state"), "paid")
            self.assertGreaterEqual(data[0].get("payment_amount") or 0, 0)
            order.action_done()
            data = order.read(["state"])
            self.assertEqual(data[0].get("state"), "done")
