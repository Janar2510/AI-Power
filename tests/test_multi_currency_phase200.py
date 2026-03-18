"""Phase 200: Multi-currency improvements."""

import unittest

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from pathlib import Path


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestMultiCurrencyPhase200(unittest.TestCase):
    """Test amount_residual, statement currency, reconciliation convert."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_amount_residual_on_invoice(self):
        """account.move has amount_residual; 0 when paid."""
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
            Move = env.get("account.move")
            MoveLine = env.get("account.move.line")
            Journal = env.get("account.journal")
            Account = env.get("account.account")
            Partner = env.get("res.partner")
            if not all([Move, MoveLine, Journal, Account, Partner]):
                self.skipTest("Models not loaded")
            journal = Journal.search([("type", "=", "sale")], limit=1)
            income = Account.search([("account_type", "=", "income")], limit=1)
            receivable = Account.search([("account_type", "=", "asset_receivable")], limit=1)
            if not all([journal.ids, income.ids, receivable.ids]):
                self.skipTest("Need journal and accounts")
            partner = Partner.create({"name": "Phase200 Test"})
            inv = Move.create({
                "journal_id": journal.ids[0],
                "partner_id": partner.ids[0],
                "move_type": "out_invoice",
                "state": "draft",
            })
            MoveLine.create({
                "move_id": inv.ids[0],
                "account_id": income.ids[0],
                "name": "Sales",
                "debit": 0,
                "credit": 75.0,
                "partner_id": partner.ids[0],
            })
            MoveLine.create({
                "move_id": inv.ids[0],
                "account_id": receivable.ids[0],
                "name": "Receivable",
                "debit": 75.0,
                "credit": 0,
                "partner_id": partner.ids[0],
            })
            inv.write({"state": "posted"})
            row = inv.read(["amount_residual"])[0]
            self.assertAlmostEqual(float(row.get("amount_residual") or 0), 75.0, places=2)
            inv.write({"state": "paid"})
            row = inv.read(["amount_residual"])[0]
            self.assertAlmostEqual(float(row.get("amount_residual") or 0), 0.0, places=2)

    def test_bank_statement_has_currency_id(self):
        """account.bank.statement has currency_id field."""
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
            Stmt = env.get("account.bank.statement")
            Journal = env.get("account.journal")
            Currency = env.get("res.currency")
            if not all([Stmt, Journal, Currency]):
                self.skipTest("Models not loaded")
            journal = Journal.search([("type", "=", "bank")], limit=1)
            eur = Currency.search([("name", "=", "EUR")], limit=1)
            if not journal.ids or not eur.ids:
                self.skipTest("Need bank journal and EUR")
            stmt = Stmt.create({
                "journal_id": journal.ids[0],
                "currency_id": eur.ids[0],
                "date": "2026-01-15",
                "balance_start": 0,
                "balance_end_real": 100,
            })
            self.assertTrue(stmt.ids)
            row = stmt.read(["currency_id"])[0]
            cid = row.get("currency_id")
            cid = cid[0] if isinstance(cid, (list, tuple)) and cid else cid
            self.assertEqual(cid, eur.ids[0])
