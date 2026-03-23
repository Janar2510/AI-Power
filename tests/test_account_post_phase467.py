"""Phase 467: posting invoices requires balanced journal items."""

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


class TestAccountPostPhase467(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.registry = Registry("_test_phase467")
        from core.orm.models import ModelBase
        ModelBase._registry = cls.registry
        clear_loaded_addon_modules()
        load_module_graph()

    def test_action_post_rejects_unbalanced_moves(self):
        move_model = self.registry.get("account.move")
        self.assertIsNotNone(move_model, "account.move should load into the registry")

        move = move_model(_FakeEnv([
            {"debit": 100.0, "credit": 0.0, "account_id": 1},
            {"debit": 0.0, "credit": 90.0, "account_id": 2},
        ]), [1])

        with self.assertRaisesRegex(ValueError, "balanced"):
            move.action_post()

    def test_action_post_rejects_moves_without_lines(self):
        move_model = self.registry.get("account.move")
        self.assertIsNotNone(move_model, "account.move should load into the registry")

        move = move_model(_FakeEnv([]), [1])

        with self.assertRaisesRegex(ValueError, "journal lines"):
            move.action_post()

    def test_action_post_marks_balanced_move_as_posted(self):
        move_model = self.registry.get("account.move")
        self.assertIsNotNone(move_model, "account.move should load into the registry")

        move = move_model(_FakeEnv([
            {"debit": 100.0, "credit": 0.0, "account_id": 1},
            {"debit": 0.0, "credit": 100.0, "account_id": 2},
        ]), [1])
        writes = []
        move.write = lambda vals: writes.append(vals) or True

        move.action_post()

        self.assertEqual(writes, [{"state": "posted"}])

