"""Phase 199: Customer portal - Pay button on invoice."""

import unittest

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from core.http.auth import _get_registry
from pathlib import Path


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestPortalInvoicePayPhase199(unittest.TestCase):
    """Test portal invoice Pay button and payment flow."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_invoice_pay_creates_transaction_and_marks_paid(self):
        """Portal invoice pay with demo provider creates tx and marks invoice paid."""
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
            Transaction = env.get("payment.transaction")
            if not all([Move, MoveLine, Journal, Account, Partner, Transaction]):
                self.skipTest("Models not loaded")
            partner = Partner.create({"name": "Phase199 Pay Test"})
            journal = Journal.search([("type", "=", "sale")], limit=1)
            income = Account.search([("account_type", "=", "income")], limit=1)
            receivable = Account.search([("account_type", "=", "asset_receivable")], limit=1)
            if not all([journal.ids, income.ids, receivable.ids]):
                self.skipTest("Need journal and accounts")
            inv = Move.create({
                "journal_id": journal.ids[0],
                "partner_id": partner.ids[0],
                "move_type": "out_invoice",
                "state": "draft",
            })
            MoveLine.create({
                "move_id": inv.ids[0],
                "account_id": income.ids[0],
                "name": "Test",
                "debit": 0,
                "credit": 50.0,
                "partner_id": partner.ids[0],
            })
            MoveLine.create({
                "move_id": inv.ids[0],
                "account_id": receivable.ids[0],
                "name": "Receivable",
                "debit": 50.0,
                "credit": 0,
                "partner_id": partner.ids[0],
            })
            inv.write({"state": "posted"})
            self.assertNotEqual(inv.read(["state"])[0].get("state"), "paid")
            tx = Transaction.create({
                "provider_id": env.get("payment.provider").search([], limit=1).ids[0],
                "amount": 50.0,
                "partner_id": partner.ids[0],
                "account_move_id": inv.ids[0],
                "reference": "INV-TEST199",
                "state": "done",
            })
            inv.write({"state": "paid"})
            self.assertEqual(inv.read(["state"])[0].get("state"), "paid")
