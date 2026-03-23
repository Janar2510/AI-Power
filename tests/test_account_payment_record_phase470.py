"""Phase 470: done payment transactions create durable account.payment records."""

import unittest
from pathlib import Path

from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.tools.config import parse_config


class _FakeSearchResult:
    def __init__(self, ids=None):
        self.ids = list(ids or [])

    def __bool__(self):
        return bool(self.ids)


class _FakePaymentModel:
    def __init__(self, existing_ids=None):
        self.existing_ids = list(existing_ids or [])
        self.created = []
        self.searched = []

    def search(self, domain, limit=None):
        self.searched.append((domain, limit))
        return _FakeSearchResult(self.existing_ids)

    def create(self, vals):
        self.created.append(vals)
        return _FakeSearchResult([len(self.created)])


class _FakeJournalModel:
    def search(self, domain, limit=None):
        codes = [value for field, op, value in domain if field == "type" and op == "="]
        if "bank" in codes:
            return _FakeSearchResult([7])
        if "general" in codes:
            return _FakeSearchResult([8])
        return _FakeSearchResult([])


class _FakeCompanyModel:
    def search(self, domain, limit=None):
        return _FakeSearchResult([3])


class _FakeInvoice:
    def __init__(self):
        self.ids = [11]
        self.sync_calls = 0

    def read(self, fields):
        row = {}
        for field in fields:
            if field == "partner_id":
                row[field] = 5
            elif field == "currency_id":
                row[field] = 2
            elif field == "date":
                row[field] = "2026-03-23"
            elif field == "name":
                row[field] = "INV/00011"
        return [row]

    def _sync_payment_state_from_transactions(self):
        self.sync_calls += 1
        return True


class _FakeInvoiceModel:
    def __init__(self, invoice):
        self.invoice = invoice

    def browse(self, move_id):
        return self.invoice


class _FakeEnv:
    def __init__(self, payment_model, invoice):
        self.models = {
            "account.move": _FakeInvoiceModel(invoice),
            "account.payment": payment_model,
            "account.journal": _FakeJournalModel(),
            "res.company": _FakeCompanyModel(),
        }

    def get(self, model_name):
        return self.models.get(model_name)


class _FakeTxRecord:
    def __init__(self, state="done", account_move_id=11, amount=50.0, reference="TX-470", partner_id=5, currency_id=2):
        self.ids = [1]
        self._state = state
        self._account_move_id = account_move_id
        self._amount = amount
        self._reference = reference
        self._partner_id = partner_id
        self._currency_id = currency_id

    def read(self, fields):
        row = {}
        for field in fields:
            if field == "state":
                row[field] = self._state
            elif field == "account_move_id":
                row[field] = self._account_move_id
            elif field == "amount":
                row[field] = self._amount
            elif field == "reference":
                row[field] = self._reference
            elif field == "partner_id":
                row[field] = self._partner_id
            elif field == "currency_id":
                row[field] = self._currency_id
        return [row]


class _FakeTxRecordset:
    def __init__(self, env, records):
        self.env = env
        self._records = records

    def __iter__(self):
        return iter(self._records)


class TestAccountPaymentRecordPhase470(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.registry = Registry("_test_phase470")
        from core.orm.models import ModelBase
        ModelBase._registry = cls.registry
        clear_loaded_addon_modules()
        load_module_graph()

    def test_done_transaction_creates_account_payment_record(self):
        tx_model = self.registry.get("payment.transaction")
        self.assertIsNotNone(tx_model, "payment.transaction should load into registry")
        payment_model = _FakePaymentModel()
        invoice = _FakeInvoice()
        recordset = _FakeTxRecordset(_FakeEnv(payment_model, invoice), [_FakeTxRecord()])

        tx_model._sync_linked_invoice_payment_state(recordset)

        self.assertEqual(invoice.sync_calls, 1)
        self.assertEqual(len(payment_model.created), 1)
        payment_vals = payment_model.created[0]
        self.assertEqual(payment_vals["move_id"], 11)
        self.assertEqual(payment_vals["amount"], 50.0)
        self.assertEqual(payment_vals["state"], "paid")
        self.assertEqual(payment_vals["payment_reference"], "TX-470")
        self.assertEqual(payment_vals["journal_id"], 7)
        self.assertEqual(payment_vals["company_id"], 3)

    def test_done_transaction_sync_is_idempotent_for_existing_payment(self):
        tx_model = self.registry.get("payment.transaction")
        self.assertIsNotNone(tx_model, "payment.transaction should load into registry")
        payment_model = _FakePaymentModel(existing_ids=[99])
        invoice = _FakeInvoice()
        recordset = _FakeTxRecordset(_FakeEnv(payment_model, invoice), [_FakeTxRecord(reference="TX-EXISTS")])

        tx_model._sync_linked_invoice_payment_state(recordset)

        self.assertEqual(invoice.sync_calls, 1)
        self.assertEqual(payment_model.created, [])

