"""Phase 734: **payment.transaction.write** ``pending`` → ``done`` triggers Phase 731 sync.

Manual-provider style: tx created pending then completed via **write** (not **create** with **done**).
"""

import unittest

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.orm.models import ModelBase
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor

from tests.payment_test_bootstrap import (
    configure_addons_path,
    ensure_bank_journal_for_payment_record,
    ensure_demo_payment_provider,
    ensure_minimal_sale_invoice_chart,
    test_db_exists,
)


class TestPaymentTransactionWriteDonePhase734(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._addons_path = configure_addons_path()
        cls.db = "_test_rpc_read"
        cls._has_db = test_db_exists(cls.db)

    def test_write_state_done_syncs_invoice_and_account_payment(self):
        if not self._has_db:
            self.skipTest("DB not found")
        parse_config(["--addons-path=" + self._addons_path])
        registry = Registry(self.db)
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
            Partner = env.get("res.partner")
            Transaction = env.get("payment.transaction")
            Payment = env.get("account.payment")
            if not all([Move, MoveLine, Partner, Transaction]):
                self.skipTest("Models not loaded")
            jid, iid, rid = ensure_minimal_sale_invoice_chart(env)
            if not all([jid, iid, rid]):
                self.skipTest("Could not bootstrap sale journal and accounts")
            provider_id = ensure_demo_payment_provider(env)
            if not provider_id:
                self.skipTest("payment.provider not available")
            if not ensure_bank_journal_for_payment_record(env):
                self.skipTest("Could not ensure bank/general journal for account.payment")
            partner = Partner.create({"name": "Phase734 Write Done"})
            inv = Move.create(
                {
                    "journal_id": jid,
                    "partner_id": partner.ids[0],
                    "move_type": "out_invoice",
                    "state": "draft",
                }
            )
            MoveLine.create(
                {
                    "move_id": inv.ids[0],
                    "account_id": iid,
                    "name": "Line",
                    "debit": 0,
                    "credit": 42.0,
                    "partner_id": partner.ids[0],
                }
            )
            MoveLine.create(
                {
                    "move_id": inv.ids[0],
                    "account_id": rid,
                    "name": "Recv",
                    "debit": 42.0,
                    "credit": 0,
                    "partner_id": partner.ids[0],
                }
            )
            inv.write({"state": "posted"})
            ref = "DB734-WRITE-DONE"
            tx = Transaction.create(
                {
                    "provider_id": provider_id,
                    "amount": 42.0,
                    "partner_id": partner.ids[0],
                    "account_move_id": inv.ids[0],
                    "reference": ref,
                    "state": "pending",
                }
            )
            self.assertEqual(inv.read(["state"])[0].get("state"), "posted")
            Transaction.browse(tx.ids[0]).write({"state": "done"})
            self.assertEqual(inv.read(["state"])[0].get("state"), "paid")
            if Payment:
                pay = Payment.search(
                    [("move_id", "=", inv.ids[0]), ("payment_reference", "=", ref)], limit=1
                )
                self.assertTrue(
                    getattr(pay, "ids", None),
                    "account.payment expected after write done (Phase 731)",
                )
