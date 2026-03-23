"""Phase 535: posting only from draft; every journal line must have an account."""

import unittest
from pathlib import Path

from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.tools.config import parse_config


class _FakeLineRecordset:
    def __init__(self, rows):
        self._rows = rows
        self.ids = list(range(1, len(rows) + 1))

    def read(self, fields):
        return [{field: row.get(field) for field in fields} for row in self._rows]


class _FakeMoveLineModel:
    def __init__(self, rows):
        self._rows = rows

    def search(self, domain):
        return _FakeLineRecordset(self._rows)


class _FakeEnv:
    def __init__(self, line_rows):
        self._line_model = _FakeMoveLineModel(line_rows)

    def get(self, model_name):
        if model_name == "account.move.line":
            return self._line_model
        return None


class TestAccountPostPhase535(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.registry = Registry("_test_phase535")
        from core.orm.models import ModelBase
        ModelBase._registry = cls.registry
        clear_loaded_addon_modules()
        load_module_graph()

    def test_action_post_rejects_non_draft(self):
        move_model = self.registry.get("account.move")
        self.assertIsNotNone(move_model)
        lines = [
            {"debit": 50.0, "credit": 0.0, "account_id": 1},
            {"debit": 0.0, "credit": 50.0, "account_id": 2},
        ]
        move = move_model(_FakeEnv(lines), [1], {"state": "posted"})
        with self.assertRaisesRegex(ValueError, "draft"):
            move.action_post()

    def test_action_post_rejects_line_without_account(self):
        move_model = self.registry.get("account.move")
        self.assertIsNotNone(move_model)
        move = move_model(_FakeEnv([
            {"debit": 50.0, "credit": 0.0, "account_id": 1},
            {"debit": 0.0, "credit": 50.0, "account_id": False},
        ]), [1])
        with self.assertRaisesRegex(ValueError, "account"):
            move.action_post()
