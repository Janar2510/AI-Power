"""Phase 118: Accounting - sale order creates invoice via action_create_invoice."""

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


class TestAccountPhase118(unittest.TestCase):
    """Test invoice creation from sale order."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_sale_order_create_invoice_and_post(self):
        """Create SO, confirm, create invoice, post, verify journal entries."""
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
            # Ensure account data exists (Phase 118 seed)
            Journal = env.get("account.journal")
            Account = env.get("account.account")
            if Journal and Account:
                if not Journal.search([("code", "=", "SALE")]):
                    for code, name, acc_type in [
                        ("1000", "Receivable", "asset_receivable"),
                        ("2000", "Payable", "liability_payable"),
                        ("4000", "Sales", "income"),
                    ]:
                        Account.create({"code": code, "name": name, "account_type": acc_type})
                    Journal.create({"name": "Sales", "code": "SALE", "type": "sale"})
                elif not Account.search([("account_type", "=", "asset_receivable")]):
                    Account.create({"code": "1000", "name": "Receivable", "account_type": "asset_receivable"})
            Partner = env.get("res.partner")
            Product = env.get("product.product")
            SaleOrder = env.get("sale.order")
            SaleLine = env.get("sale.order.line")
            Move = env.get("account.move")
            MoveLine = env.get("account.move.line")
            missing = [n for n, m in [
                ("Partner", Partner), ("Product", Product), ("SaleOrder", SaleOrder),
                ("SaleLine", SaleLine), ("Move", Move), ("MoveLine", MoveLine),
            ] if m is None]
            if missing:
                self.skipTest(f"Required models not loaded: {missing}")
            partner = Partner.search([], limit=1)
            if not partner.ids:
                partner = Partner.create({"name": "Invoice Test Customer", "email": "cust@test.com"})
            product = Product.search([], limit=1)
            if not product.ids:
                product = Product.create({"name": "Test Product", "list_price": 15.0})
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
                "price_unit": 15.0,
            })
            order.action_confirm()
            order.action_create_invoice()
            moves = Move.search([("invoice_origin", "=", order_name)])
            self.assertGreater(len(moves.ids), 0, "Invoice should be created from SO")
            move_id = moves.ids[0]
            Move.browse(move_id).write({"state": "posted"})
            move_data = Move.browse(move_id).read(["state"])[0]
            self.assertEqual(move_data.get("state"), "posted")
            lines = MoveLine.search([("move_id", "=", move_id)])
            self.assertGreaterEqual(len(lines.ids), 2, "Invoice should have at least 2 journal lines")
            rows = lines.read(["debit", "credit"])
            total_debit = sum(r.get("debit", 0) for r in rows)
            total_credit = sum(r.get("credit", 0) for r in rows)
            self.assertAlmostEqual(total_debit, total_credit, places=2, msg="Debits must equal credits")
