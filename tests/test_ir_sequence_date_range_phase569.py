"""Phase 569: ir.sequence.use_date_range + next_by_code(..., reference_date=…)."""

import unittest

from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.orm.models import ModelBase
from core.tools.config import parse_config


class _MockCr:
    """Minimal cursor: handles SAVEPOINT noise + queued fetchone results."""

    def __init__(self, fetch_sequence):
        self._fetch = list(fetch_sequence)
        self.executed = []

    def execute(self, query, params=None):
        q = query.strip() if isinstance(query, str) else ""
        if "SAVEPOINT" in q or "RELEASE SAVEPOINT" in q or "ROLLBACK TO SAVEPOINT" in q:
            return
        self.executed.append((q.split("\n")[0][:80], params))

    def fetchone(self):
        if not self._fetch:
            return None
        return self._fetch.pop(0)


class _FakeEnv:
    def __init__(self, cr):
        self.cr = cr


class TestIrSequenceDateRangePhase569(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.registry = Registry("_test_phase569")
        ModelBase._registry = cls.registry
        clear_loaded_addon_modules()
        load_module_graph()

    def test_next_by_code_uses_date_range_subrow(self):
        IrSequence = self.registry.get("ir.sequence")
        self.assertIsNotNone(IrSequence)
        # resolve id -> meta -> pick dr id -> update dr RETURNING number_next only
        cr = _MockCr([
            (10,),  # _resolve_sequence_row_id
            (True, "INV/", "", 3),  # use_date_range, prefix, suffix, padding
            (20,),  # date_range id
            (51,),  # RETURNING number_next from ir_sequence_date_range
        ])
        env = _FakeEnv(cr)
        IrSequence._registry.set_env(env)
        try:
            out = IrSequence.next_by_code("seq.test569", company_id=None, reference_date="2025-03-15")
        finally:
            IrSequence._registry.set_env(None)
        self.assertEqual(out, "INV/051")
        self.assertTrue(any("ir_sequence_date_range" in str(e[0]) for e in cr.executed))

    def test_next_by_code_falls_back_when_no_date_range_row(self):
        IrSequence = self.registry.get("ir.sequence")
        cr = _MockCr([
            (10,),
            (True, "", "", 0),
            None,  # no date_range match
            (7, "", "", 0),  # main ir_sequence RETURNING
        ])
        env = _FakeEnv(cr)
        IrSequence._registry.set_env(env)
        try:
            out = IrSequence.next_by_code("seq.test569b", reference_date="2025-03-15")
        finally:
            IrSequence._registry.set_env(None)
        self.assertEqual(out, 7)

    def test_normalize_reference_date_str(self):
        IrSequence = self.registry.get("ir.sequence")
        self.assertEqual(IrSequence._normalize_reference_date_str("2025-08-01"), "2025-08-01")
        self.assertEqual(len(IrSequence._normalize_reference_date_str(None)), 10)
