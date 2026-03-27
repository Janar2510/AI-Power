"""Phase 199 + 732 + 733: Customer portal - Pay button on invoice.

Asserts invoice reaches **paid** via **payment.transaction** create (**Phase 731** sync),
not a direct **account.move.write**.

**Phase 733:** CoA bootstrap lives in **tests.payment_test_bootstrap** when **load_default_data**
is thin.
"""

import unittest

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor

from tests.payment_test_bootstrap import (
    configure_addons_path,
    ensure_demo_payment_provider,
    ensure_minimal_sale_invoice_chart,
    test_db_exists,
)


class TestPortalInvoicePayPhase199(unittest.TestCase):
    """Test portal invoice Pay button and payment flow."""

    @classmethod
    def setUpClass(cls):
        cls._addons_path = configure_addons_path()
        cls.db = "_test_rpc_read"
        cls._has_db = test_db_exists(cls.db)

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
            jid, iid, rid = ensure_minimal_sale_invoice_chart(env)
            if not all([jid, iid, rid]):
                self.skipTest("Could not bootstrap sale journal and accounts")
            provider_id = ensure_demo_payment_provider(env)
            if not provider_id:
                self.skipTest("payment.provider not available")
            inv = Move.create({
                "journal_id": jid,
                "partner_id": partner.ids[0],
                "move_type": "out_invoice",
                "state": "draft",
            })
            MoveLine.create({
                "move_id": inv.ids[0],
                "account_id": iid,
                "name": "Test",
                "debit": 0,
                "credit": 50.0,
                "partner_id": partner.ids[0],
            })
            MoveLine.create({
                "move_id": inv.ids[0],
                "account_id": rid,
                "name": "Receivable",
                "debit": 50.0,
                "credit": 0,
                "partner_id": partner.ids[0],
            })
            inv.write({"state": "posted"})
            self.assertNotEqual(inv.read(["state"])[0].get("state"), "paid")
            Transaction.create({
                "provider_id": provider_id,
                "amount": 50.0,
                "partner_id": partner.ids[0],
                "account_move_id": inv.ids[0],
                "reference": "INV-TEST199",
                "state": "done",
            })
            # Phase 731/732: done tx on create triggers _sync_linked_invoice_payment_state (no inv.write paid).
            self.assertEqual(inv.read(["state"])[0].get("state"), "paid")
