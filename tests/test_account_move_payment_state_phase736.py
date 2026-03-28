"""Phase 736: account.move.payment_state richer invoice payment semantics."""

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
        for row in self._rows:
            if want_move is not None and row.get("account_move_id") != want_move:
                continue
            if want_state is not None and row.get("state") != want_state:
                continue
            matched.append(row)
        return _FakeSearchResult(rows=matched, ids=list(range(1, len(matched) + 1)))


class _FakeEnv:
    def __init__(self, move_line_rows=None, tx_rows=None):
        self.models = {
            "account.move.line": _FakeMoveLineModel(move_line_rows or []),
            "account.account": _FakeAccountModel(),
            "payment.transaction": _FakeTransactionModel(tx_rows or []),
        }

    def get(self, model_name):
        return self.models.get(model_name)


class _FakeMoveRecord:
    def __init__(self, state="posted", move_type="out_invoice", currency_id=None):
        self.ids = [1]
        self._state = state
        self._move_type = move_type
        self._currency_id = currency_id

    def read(self, fields):
        row = {"id": 1}
        for field in fields:
            if field == "state":
                row[field] = self._state
            elif field == "move_type":
                row[field] = self._move_type
            elif field == "currency_id":
                row[field] = self._currency_id
        return [row]


class _FakeMoveRecordset:
    def __init__(self, env, records):
        self.env = env
        self.ids = [record.ids[0] for record in records]
        self._records = records

    def __iter__(self):
        return iter(self._records)

    def __bool__(self):
        return bool(self._records)


class TestAccountMovePaymentStatePhase736(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.registry = Registry("_test_phase736")
        from core.orm.models import ModelBase
        ModelBase._registry = cls.registry
        clear_loaded_addon_modules()
        load_module_graph()

    def _invoice_lines(self, amount=100.0):
        return [
            {"account_id": 101, "debit": amount, "credit": 0.0, "amount_currency": 0.0, "currency_id": None},
            {"account_id": 41, "debit": 0.0, "credit": amount, "amount_currency": 0.0, "currency_id": None},
        ]

    def test_payment_state_not_paid_for_fresh_invoice(self):
        move_model = self.registry.get("account.move")
        env = _FakeEnv(move_line_rows=self._invoice_lines(), tx_rows=[])
        recordset = _FakeMoveRecordset(env, [_FakeMoveRecord()])

        result = move_model._compute_payment_state(recordset)

        self.assertEqual(result, ["not_paid"])

    def test_payment_state_partial_when_done_transactions_cover_some_balance(self):
        move_model = self.registry.get("account.move")
        env = _FakeEnv(
            move_line_rows=self._invoice_lines(),
            tx_rows=[{"amount": 40.0, "state": "done", "account_move_id": 1}],
        )
        recordset = _FakeMoveRecordset(env, [_FakeMoveRecord()])

        result = move_model._compute_payment_state(recordset)

        self.assertEqual(result, ["partial"])

    def test_payment_state_paid_when_done_transactions_cover_total(self):
        move_model = self.registry.get("account.move")
        env = _FakeEnv(
            move_line_rows=self._invoice_lines(),
            tx_rows=[{"amount": 100.0, "state": "done", "account_move_id": 1}],
        )
        recordset = _FakeMoveRecordset(env, [_FakeMoveRecord()])

        result = move_model._compute_payment_state(recordset)

        self.assertEqual(result, ["paid"])

    def test_payment_state_in_payment_when_pending_transaction_exists(self):
        move_model = self.registry.get("account.move")
        env = _FakeEnv(
            move_line_rows=self._invoice_lines(),
            tx_rows=[{"amount": 100.0, "state": "pending", "account_move_id": 1}],
        )
        recordset = _FakeMoveRecordset(env, [_FakeMoveRecord()])

        result = move_model._compute_payment_state(recordset)

        self.assertEqual(result, ["in_payment"])
