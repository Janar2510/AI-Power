"""Phase 156: Payment integration - payment.provider, payment.transaction, checkout."""

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


class TestPaymentPhase156(unittest.TestCase):
    """Test payment provider, transaction, checkout integration."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_payment_provider_create(self):
        """payment.provider can be created with code demo/manual."""
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
            Provider = env.get("payment.provider")
            if not Provider:
                self.skipTest("payment.provider not loaded")
            p = Provider.create({"name": "Demo", "code": "demo", "state": "enabled"})
            self.assertIsNotNone(p.id if hasattr(p, "id") else (p.ids[0] if p.ids else None))
            row = Provider.browse(p.ids[0]).read(["name", "code"])[0]
            self.assertEqual(row.get("name"), "Demo")
            self.assertEqual(row.get("code"), "demo")

    def test_payment_transaction_create(self):
        """payment.transaction links to provider, order, amount."""
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
            Provider = env.get("payment.provider")
            Transaction = env.get("payment.transaction")
            Order = env.get("sale.order")
            Partner = env.get("res.partner")
            if not all([Provider, Transaction, Order, Partner]):
                self.skipTest("Required models not loaded")
            partners = Partner.search([], limit=1)
            if not partners.ids:
                Partner.create({"name": "Test"})
                partners = Partner.search([], limit=1)
            order = Order.create({"partner_id": partners.ids[0], "name": "SO-TEST", "order_line": []})
            providers = Provider.search([("code", "=", "demo")], limit=1)
            if not providers.ids:
                Provider.create({"name": "Demo", "code": "demo", "state": "enabled"})
                providers = Provider.search([("code", "=", "demo")], limit=1)
            tx = Transaction.create({
                "provider_id": providers.ids[0],
                "amount": 99.99,
                "partner_id": partners.ids[0],
                "sale_order_id": order.id,
                "reference": "PAY-TEST123",
                "state": "done",
            })
            self.assertIsNotNone(tx.id if hasattr(tx, "id") else (tx.ids[0] if tx.ids else None))
            row = Transaction.browse(tx.ids[0]).read(["amount", "state", "reference"])[0]
            self.assertAlmostEqual(float(row.get("amount") or 0), 99.99, places=2)
            self.assertEqual(row.get("state"), "done")
            self.assertEqual(row.get("reference"), "PAY-TEST123")
