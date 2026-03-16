"""Phase 154: Multi-currency conversion - res.currency.convert, SO/PO/invoice in foreign currency."""

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


class TestCurrencyPhase154(unittest.TestCase):
    """Test multi-currency: convert, SO/PO default currency, invoice conversion."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_currency_convert(self):
        """res.currency.convert uses rates for date."""
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
            Currency = env.get("res.currency")
            if not Currency:
                self.skipTest("res.currency not loaded")
            eur = Currency.search([("name", "=", "EUR")], limit=1)
            usd = Currency.search([("name", "=", "USD")], limit=1)
            if not eur.ids or not usd.ids:
                self.skipTest("EUR/USD currencies not seeded")
            eur_id, usd_id = eur.ids[0], usd.ids[0]
            converted = Currency.convert(100.0, eur_id, usd_id, None)
            self.assertAlmostEqual(converted, 110.0, places=2)
            back = Currency.convert(converted, usd_id, eur_id, None)
            self.assertAlmostEqual(back, 100.0, places=2)
            same = Currency.convert(100.0, eur_id, eur_id, None)
            self.assertEqual(same, 100.0)

    def test_sale_order_default_currency(self):
        """Sale order create defaults currency_id from company."""
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
            SaleOrder = env.get("sale.order")
            Partner = env.get("res.partner")
            if not all([SaleOrder, Partner]):
                self.skipTest("Required models not loaded")
            partners = Partner.search([], limit=1)
            if not partners.ids:
                Partner.create({"name": "Test Customer"})
                partners = Partner.search([], limit=1)
            order = SaleOrder.create({"partner_id": partners.ids[0], "name": "New"})
            data = order.read(["currency_id"])[0]
            cid = data.get("currency_id")
            if isinstance(cid, (list, tuple)) and cid:
                cid = cid[0]
            self.assertIsNotNone(cid, "Sale order should have default currency from company")

    def test_purchase_order_amount_total(self):
        """Purchase order has amount_total from lines."""
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
            PurchaseOrder = env.get("purchase.order")
            PurchaseLine = env.get("purchase.order.line")
            Partner = env.get("res.partner")
            if not all([PurchaseOrder, PurchaseLine, Partner]):
                self.skipTest("Required models not loaded")
            partners = Partner.search([], limit=1)
            if not partners.ids:
                Partner.create({"name": "Test Vendor"})
                partners = Partner.search([], limit=1)
            order = PurchaseOrder.create({"partner_id": partners.ids[0]})
            PurchaseLine.create({
                "order_id": order.id,
                "name": "Item",
                "product_qty": 2.0,
                "price_unit": 25.0,
            })
            data = order.read(["amount_total"])[0]
            total = data.get("amount_total")
            total = float(total) if total is not None else 0.0
            self.assertAlmostEqual(total, 50.0, places=2)
