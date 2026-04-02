"""Phase 815: ir.rule XML is not loaded via generic data loader (init_data._load_ir_rules owns it)."""

import unittest

from core.data import data_loader


class TestDataLoaderIrRuleSkipPhase815(unittest.TestCase):
    def test_ir_rule_in_skip_models_for_generic_loader(self):
        self.assertIn("ir.rule", data_loader._SKIP_MODELS)
