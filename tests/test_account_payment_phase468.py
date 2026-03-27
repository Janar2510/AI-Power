"""Phase 468 + 731: payment transactions apply against invoice residual/state.

Evidence for checklist row 33: ``account.move`` residual nets done ``payment.transaction``
rows (``account_move_id``); ``_sync_payment_state_from_transactions`` sets ``paid`` when
fully covered. Uses registry + fakes (no DB graph). See also ``test_account_payment_record_phase470``.
"""

import unittest
from pathlib import Path

from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.tools.config import parse_config


class _FakeSearchResult:
    def __init__(self, rows=None, ids=None):
        self._rows = list(rows or [])
        self.ids = list(ids or [])

    def __iter__(self):
        return iter([])

    def read(self, fields):
        return [{field: row.get(field) for field in fields} for row in self._rows]


class _FakeAccountModel:
    def search(self, domain, limit=None):
        account_type = None
        for field, op, value in domain:
            if field == "account_type" and op == "=":
                account_type = value
                break
        if account_type == "asset_receivable":
            return _FakeSearchResult(ids=[101])
        if account_type == "liability_payable":
            return _FakeSearchResult(ids=[202])
        return _FakeSearchResult(ids=[])


class _FakeMoveLineModel:
    def __init__(self, rows):
        self._rows = rows

    def search(self, domain):
        return _FakeSearchResult(rows=self._rows, ids=list(range(1, len(self._rows) + 1)))


class _FakeTransactionModel:
    """Rows may include account_move_id (int) and state for domain filtering (Phase 731)."""

    def __init__(self, rows):
        self._rows = rows

    def search(self, domain):
        want_move = None
        want_state = None
        for field, op, value in domain:
            if field == "account_move_id" and op == "=":
                want_move = value
            elif field == "state" and op == "=":
                want_state = value
        matched = []
        for i, row in enumerate(self._rows):
            mid = row.get("account_move_id", 1)
            st = row.get("state", "done")
            if want_move is not None and mid != want_move:
                continue
            if want_state is not None and st != want_state:
                continue
            matched.append(row)
        return _FakeSearchResult(rows=matched, ids=list(range(1, len(matched) + 1)))


class _FakeInvoice:
    def __init__(self, residual, state="posted"):
        self.ids = [11]
        self._residual = residual
        self._state = state
        self.writes = []

    def read(self, fields):
        row = {}
        for field in fields:
            if field == "state":
                row[field] = self._state
            elif field == "amount_residual":
                row[field] = self._residual
        return [row]

    def write(self, vals):
        self.writes.append(vals)
        if "state" in vals:
            self._state = vals["state"]
        return True

    def _sync_payment_state_from_transactions(self):
        return True


class _FakeInvoiceModel:
    def __init__(self, invoice):
        self.invoice = invoice

    def browse(self, move_id):
        return self.invoice


class _FakeEnv:
    def __init__(self, move_line_rows=None, tx_rows=None, invoice=None):
        self.models = {
            "account.move.line": _FakeMoveLineModel(move_line_rows or []),
            "account.account": _FakeAccountModel(),
            "payment.transaction": _FakeTransactionModel(tx_rows or []),
        }
        if invoice is not None:
            self.models["account.move"] = _FakeInvoiceModel(invoice)

    def get(self, model_name):
        return self.models.get(model_name)


class _FakeMoveRecord:
    def __init__(self, residual=None, state="posted"):
        self.ids = [1]
        self._state = state
        self._currency_id = None
        self._move_type = "out_invoice"
        self.writes = []
        self._residual = residual

    def read(self, fields):
        row = {"id": 1}
        for field in fields:
            if field == "state":
                row[field] = self._state
            elif field == "move_type":
                row[field] = self._move_type
            elif field == "currency_id":
                row[field] = self._currency_id
            elif field == "amount_residual" and self._residual is not None:
                row[field] = self._residual
        return [row]

    def write(self, vals):
        self.writes.append(vals)
        if "state" in vals:
            self._state = vals["state"]
        return True


class _FakeMoveRecordset:
    def __init__(self, env, records):
        self.env = env
        self.ids = [record.ids[0] for record in records]
        self._records = records

    def __iter__(self):
        return iter(self._records)

    def __bool__(self):
        return bool(self._records)


class _FakeTxRecord:
    def __init__(self, state="done", account_move_id=11):
        self.ids = [1]
        self._state = state
        self._account_move_id = account_move_id

    def read(self, fields):
        row = {}
        for field in fields:
            if field == "state":
                row[field] = self._state
            elif field == "account_move_id":
                row[field] = self._account_move_id
        return [row]


class _FakeTxRecordset:
    def __init__(self, env, records):
        self.env = env
        self._records = records

    def __iter__(self):
        return iter(self._records)


class TestAccountPaymentPhase468(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.registry = Registry("_test_phase468")
        from core.orm.models import ModelBase
        ModelBase._registry = cls.registry
        clear_loaded_addon_modules()
        load_module_graph()

    def test_amount_residual_subtracts_done_transactions(self):
        move_model = self.registry.get("account.move")
        self.assertIsNotNone(move_model, "account.move should load into registry")
        env = _FakeEnv(
            move_line_rows=[
                {"account_id": 101, "debit": 100.0, "credit": 0.0, "amount_currency": 0.0, "currency_id": None},
                {"account_id": 41, "debit": 0.0, "credit": 100.0, "amount_currency": 0.0, "currency_id": None},
            ],
            tx_rows=[
                {"amount": 30.0, "state": "done", "account_move_id": 1},
            ],
        )
        recordset = _FakeMoveRecordset(env, [_FakeMoveRecord()])

        result = move_model._compute_amount_residual(recordset)

        self.assertEqual(result, [70.0])

    def test_sync_payment_state_marks_invoice_paid_when_fully_covered(self):
        move_model = self.registry.get("account.move")
        self.assertIsNotNone(move_model, "account.move should load into registry")
        env = _FakeEnv(
            move_line_rows=[
                {"account_id": 101, "debit": 100.0, "credit": 0.0, "amount_currency": 0.0, "currency_id": None},
                {"account_id": 41, "debit": 0.0, "credit": 100.0, "amount_currency": 0.0, "currency_id": None},
            ],
            tx_rows=[
                {"amount": 100.0, "state": "done", "account_move_id": 1},
            ],
        )
        invoice = _FakeMoveRecord(residual=0.0, state="posted")
        recordset = _FakeMoveRecordset(env, [invoice])

        move_model._sync_payment_state_from_transactions(recordset)

        self.assertEqual(invoice.writes, [{"state": "paid"}])

    def test_done_transaction_syncs_linked_invoice(self):
        tx_model = self.registry.get("payment.transaction")
        self.assertIsNotNone(tx_model, "payment.transaction should load into registry")
        invoice = _FakeInvoice(residual=0.0)
        invoice.sync_calls = 0

        def _sync():
            invoice.sync_calls += 1
            return True

        invoice._sync_payment_state_from_transactions = _sync
        env = _FakeEnv(invoice=invoice)
        recordset = _FakeTxRecordset(env, [_FakeTxRecord(state="done", account_move_id=11)])

        tx_model._sync_linked_invoice_payment_state(recordset)

        self.assertEqual(invoice.sync_calls, 1)

    def test_amount_residual_sums_multiple_done_transactions(self):
        move_model = self.registry.get("account.move")
        env = _FakeEnv(
            move_line_rows=[
                {"account_id": 101, "debit": 100.0, "credit": 0.0, "amount_currency": 0.0, "currency_id": None},
                {"account_id": 41, "debit": 0.0, "credit": 100.0, "amount_currency": 0.0, "currency_id": None},
            ],
            tx_rows=[
                {"amount": 35.0, "state": "done", "account_move_id": 1},
                {"amount": 25.0, "state": "done", "account_move_id": 1},
            ],
        )
        recordset = _FakeMoveRecordset(env, [_FakeMoveRecord()])

        result = move_model._compute_amount_residual(recordset)

        self.assertEqual(result, [40.0])

    def test_sync_payment_state_stays_posted_when_partially_paid(self):
        move_model = self.registry.get("account.move")
        env = _FakeEnv(
            move_line_rows=[
                {"account_id": 101, "debit": 100.0, "credit": 0.0, "amount_currency": 0.0, "currency_id": None},
                {"account_id": 41, "debit": 0.0, "credit": 100.0, "amount_currency": 0.0, "currency_id": None},
            ],
            tx_rows=[
                {"amount": 30.0, "state": "done", "account_move_id": 1},
                {"amount": 40.0, "state": "done", "account_move_id": 1},
            ],
        )
        invoice = _FakeMoveRecord(state="posted")
        recordset = _FakeMoveRecordset(env, [invoice])

        move_model._sync_payment_state_from_transactions(recordset)

        self.assertEqual(invoice.writes, [])

    def test_sync_payment_state_paid_when_two_transactions_cover_balance(self):
        move_model = self.registry.get("account.move")
        env = _FakeEnv(
            move_line_rows=[
                {"account_id": 101, "debit": 100.0, "credit": 0.0, "amount_currency": 0.0, "currency_id": None},
                {"account_id": 41, "debit": 0.0, "credit": 100.0, "amount_currency": 0.0, "currency_id": None},
            ],
            tx_rows=[
                {"amount": 60.0, "state": "done", "account_move_id": 1},
                {"amount": 40.0, "state": "done", "account_move_id": 1},
            ],
        )
        invoice = _FakeMoveRecord(state="posted")
        recordset = _FakeMoveRecordset(env, [invoice])

        move_model._sync_payment_state_from_transactions(recordset)

        self.assertEqual(invoice.writes, [{"state": "paid"}])

    def test_pending_transaction_does_not_sync_linked_invoice(self):
        tx_model = self.registry.get("payment.transaction")
        invoice = _FakeInvoice(residual=100.0)
        invoice.sync_calls = 0

        def _sync():
            invoice.sync_calls += 1
            return True

        invoice._sync_payment_state_from_transactions = _sync
        env = _FakeEnv(invoice=invoice)
        recordset = _FakeTxRecordset(env, [_FakeTxRecord(state="pending", account_move_id=11)])

        tx_model._sync_linked_invoice_payment_state(recordset)

        self.assertEqual(invoice.sync_calls, 0)

