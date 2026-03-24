"""Phase 551: fiscal position tax mapping on purchase orders and draft account.move lines (DB optional)."""

import unittest
import uuid

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.orm.models import ModelBase
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


class TestAccountFiscalPurchaseInvoicePhase551(unittest.TestCase):
    """Fiscal remap on PO lines (taxes_id) and invoice lines (tax_ids)."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = db_exists(cls.db)

    def test_fiscal_position_maps_purchase_line_tax(self):
        if not self._has_db:
            self.skipTest("DB not found")
        with get_cursor(self.db) as cr:
            registry = Registry(self.db)
            ModelBase._registry = registry
            clear_loaded_addon_modules()
            load_module_graph()
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)

            Tax = env.get("account.tax")
            FP = env.get("account.fiscal.position")
            FPLine = env.get("account.fiscal.position.tax")
            Partner = env.get("res.partner")
            PO = env.get("purchase.order")
            PoLine = env.get("purchase.order.line")
            if not all([Tax, FP, FPLine, Partner, PO, PoLine]):
                self.skipTest("models missing")

            t_dom = Tax.create(
                {
                    "name": "551-P-Dom-" + uuid.uuid4().hex[:4],
                    "amount": 20.0,
                    "amount_type": "percent",
                    "type_tax_use": "purchase",
                }
            )
            t_b2b = Tax.create(
                {
                    "name": "551-P-B2B-" + uuid.uuid4().hex[:4],
                    "amount": 10.0,
                    "amount_type": "percent",
                    "type_tax_use": "purchase",
                }
            )
            tid_dom = t_dom.ids[0]
            tid_b2b = t_b2b.ids[0]

            fp = FP.create({"name": "551 PO FP " + uuid.uuid4().hex[:4]})
            fp_id = fp.ids[0]
            FPLine.create({"fiscal_position_id": fp_id, "tax_src_id": tid_dom, "tax_dest_id": tid_b2b})

            vendor = Partner.create({"name": "551 Vendor"})
            po = PO.create({"partner_id": vendor.ids[0], "state": "draft"})
            po_id = po.ids[0]
            PoLine.create(
                {
                    "order_id": po_id,
                    "name": "Line",
                    "product_qty": 1.0,
                    "price_unit": 50.0,
                    "taxes_id": [(6, 0, [tid_dom])],
                }
            )
            PO.browse(po_id).write({"fiscal_position_id": fp_id})
            PO.browse(po_id).apply_fiscal_position_taxes()

            lines = PoLine.search([("order_id", "=", po_id)])
            self.assertTrue(lines.ids)
            tax_after = lines.read(["taxes_id"])[0].get("taxes_id") or []
            ids_flat = [x[0] if isinstance(x, (list, tuple)) and x else x for x in tax_after]
            self.assertEqual(ids_flat, [tid_b2b])

    def test_fiscal_position_maps_draft_move_line_tax(self):
        if not self._has_db:
            self.skipTest("DB not found")
        with get_cursor(self.db) as cr:
            registry = Registry(self.db)
            ModelBase._registry = registry
            clear_loaded_addon_modules()
            load_module_graph()
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)

            Tax = env.get("account.tax")
            FP = env.get("account.fiscal.position")
            FPLine = env.get("account.fiscal.position.tax")
            Move = env.get("account.move")
            MoveLine = env.get("account.move.line")
            Journal = env.get("account.journal")
            Account = env.get("account.account")
            Partner = env.get("res.partner")
            if not all([Tax, FP, FPLine, Move, MoveLine, Journal, Account, Partner]):
                self.skipTest("models missing")

            t_a = Tax.create(
                {
                    "name": "551-M-A-" + uuid.uuid4().hex[:4],
                    "amount": 15.0,
                    "amount_type": "percent",
                    "type_tax_use": "sale",
                }
            )
            t_b = Tax.create(
                {
                    "name": "551-M-B-" + uuid.uuid4().hex[:4],
                    "amount": 5.0,
                    "amount_type": "percent",
                    "type_tax_use": "sale",
                }
            )
            tid_a = t_a.ids[0]
            tid_b = t_b.ids[0]

            fp = FP.create({"name": "551 Move FP " + uuid.uuid4().hex[:4]})
            fp_id = fp.ids[0]
            FPLine.create({"fiscal_position_id": fp_id, "tax_src_id": tid_a, "tax_dest_id": tid_b})

            journal = Journal.search([("type", "=", "sale")], limit=1)
            income = Account.search([("account_type", "=", "income")], limit=1)
            receivable = Account.search([("account_type", "=", "asset_receivable")], limit=1)
            if not all([journal.ids, income.ids, receivable.ids]):
                self.skipTest("Need journal and accounts")

            partner = Partner.create({"name": "551 Inv Customer"})
            inv = Move.create(
                {
                    "journal_id": journal.ids[0],
                    "partner_id": partner.ids[0],
                    "move_type": "out_invoice",
                    "state": "draft",
                    "fiscal_position_id": fp_id,
                }
            )
            mid = inv.ids[0]
            MoveLine.create(
                {
                    "move_id": mid,
                    "account_id": income.ids[0],
                    "name": "Product with tax",
                    "debit": 0.0,
                    "credit": 100.0,
                    "partner_id": partner.ids[0],
                    "tax_ids": [(6, 0, [tid_a])],
                }
            )
            MoveLine.create(
                {
                    "move_id": mid,
                    "account_id": receivable.ids[0],
                    "name": "Receivable",
                    "debit": 100.0,
                    "credit": 0.0,
                    "partner_id": partner.ids[0],
                }
            )
            Move.browse(mid).apply_fiscal_position_taxes()

            lines = MoveLine.search([("move_id", "=", mid), ("credit", ">", 0)])
            self.assertTrue(lines.ids)
            tax_after = lines.read(["tax_ids"])[0].get("tax_ids") or []
            ids_flat = [x[0] if isinstance(x, (list, tuple)) and x else x for x in tax_after]
            self.assertEqual(ids_flat, [tid_b])
