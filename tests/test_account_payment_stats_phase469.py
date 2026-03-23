"""Phase 469: account.move payment stats should include direct transaction links."""

import unittest
from pathlib import Path

from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.tools.config import parse_config


class _FakeTxSearchResult:
    def __init__(self, rows):
        self._rows = list(rows)
        self.ids = list(range(1, len(rows) + 1))

    def read(self, fields):
        return [{field: row.get(field) for field in fields} for row in self._rows]

    def __len__(self):
        return len(self.ids)


class _FakeTransactionModel:
    def __init__(self, rows):
        self._rows = rows

    def search(self, domain):
        return _FakeTxSearchResult(self._rows)


class _FakeEnv:
    def __init__(self, tx_rows):
        self.models = {
            "payment.transaction": _FakeTransactionModel(tx_rows),
        }

    def get(self, model_name):
        return self.models.get(model_name)


class _FakeMoveRecord:
    def __init__(self, move_id=11):
        self.ids = [move_id]
        self.id = move_id
        self.transaction_ids = None
        self.transaction_count = None
        self.amount_paid = None


class _FakeMoveRecordset:
    def __init__(self, env, records):
        self.env = env
        self._records = records

    def __iter__(self):
        return iter(self._records)


class TestAccountPaymentStatsPhase469(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.registry = Registry("_test_phase469")
        from core.orm.models import ModelBase
        ModelBase._registry = cls.registry
        clear_loaded_addon_modules()
        load_module_graph()

    def test_transaction_count_falls_back_to_direct_account_move_link(self):
        move_model = self.registry.get("account.move")
        self.assertIsNotNone(move_model, "account.move should load into registry")
        record = _FakeMoveRecord()
        recordset = _FakeMoveRecordset(
            _FakeEnv([
                {"amount": 30.0, "state": "done"},
                {"amount": 15.0, "state": "pending"},
            ]),
            [record],
        )

        move_model._compute_transaction_count(recordset)

        self.assertEqual(record.transaction_count, 2)

    def test_amount_paid_falls_back_to_direct_done_transactions(self):
        move_model = self.registry.get("account.move")
        self.assertIsNotNone(move_model, "account.move should load into registry")
        record = _FakeMoveRecord()
        recordset = _FakeMoveRecordset(
            _FakeEnv([
                {"amount": 30.0, "state": "done"},
                {"amount": 15.0, "state": "pending"},
                {"amount": 12.5, "state": "done"},
            ]),
            [record],
        )

        move_model._compute_amount_paid(recordset)

        self.assertAlmostEqual(record.amount_paid, 42.5, places=2)

