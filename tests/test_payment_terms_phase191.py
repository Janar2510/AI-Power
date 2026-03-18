"""Phase 191: Payment Terms - account.payment.term, compute(), invoice_date_due, sale/purchase."""

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


class TestPaymentTermsPhase191(unittest.TestCase):
    """Test account.payment.term, compute(), and invoice_date_due."""

    @classmethod
    def setUpClass(cls):
        from pathlib import Path
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_payment_term_compute_single_balance(self):
        """Term with one balance line returns single installment."""
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
            Term = env.get("account.payment.term")
            Line = env.get("account.payment.term.line")
            if not Term or not Line:
                self.skipTest("Models not loaded")
            pt = Term.create({"name": "Net 30"})
            Line.create({
                "payment_id": pt.ids[0],
                "value": "balance",
                "days": 30,
                "sequence": 10,
            })
            result = pt.compute(100.0, "2025-03-01")
            self.assertEqual(len(result), 1)
            self.assertEqual(result[0][0], 100.0)
            self.assertIn("2025-03-31", result[0][1])

    def test_payment_term_compute_two_installments(self):
        """Term with 50% now + 50% in 30 days."""
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
            Term = env.get("account.payment.term")
            Line = env.get("account.payment.term.line")
            if not Term or not Line:
                self.skipTest("Models not loaded")
            pt = Term.create({"name": "50/50"})
            Line.create({"payment_id": pt.ids[0], "value": "percent", "value_amount": 50.0, "days": 0, "sequence": 10})
            Line.create({"payment_id": pt.ids[0], "value": "balance", "days": 30, "sequence": 20})
            result = pt.compute(200.0, "2025-03-01")
            self.assertEqual(len(result), 2)
            self.assertEqual(result[0][0], 100.0)
            self.assertEqual(result[1][0], 100.0)
            self.assertIn("2025-03-31", result[1][1])

    def test_invoice_date_due_computed(self):
        """account.move invoice_date_due computed from payment term."""
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
            Term = env.get("account.payment.term")
            Line = env.get("account.payment.term.line")
            Move = env.get("account.move")
            MoveLine = env.get("account.move.line")
            Journal = env.get("account.journal")
            Account = env.get("account.account")
            if not all([Term, Line, Move, MoveLine, Journal, Account]):
                self.skipTest("Models not loaded")
            journal = Journal.search([("type", "=", "sale")], limit=1)
            recv = Account.search([("account_type", "=", "asset_receivable")], limit=1)
            income = Account.search([("account_type", "=", "income")], limit=1)
            if not journal.ids or not recv.ids or not income.ids:
                self.skipTest("No journal/accounts")
            pt = Term.create({"name": "Net 15"})
            Line.create({"payment_id": pt.ids[0], "value": "balance", "days": 15, "sequence": 10})
            move = Move.create({
                "name": "INV/TEST",
                "journal_id": journal.ids[0],
                "move_type": "out_invoice",
                "date": "2025-03-01",
                "payment_term_id": pt.ids[0],
                "state": "draft",
            })
            MoveLine.create({
                "move_id": move.ids[0],
                "account_id": recv.ids[0],
                "name": "Receivable",
                "debit": 500.0,
                "credit": 0.0,
            })
            MoveLine.create({
                "move_id": move.ids[0],
                "account_id": income.ids[0],
                "name": "Revenue",
                "debit": 0.0,
                "credit": 500.0,
            })
            move.write({})
            row = move.read(["invoice_date_due"])[0]
            due = row.get("invoice_date_due")
            self.assertIsNotNone(due)
            self.assertIn("2025-03-16", str(due))
