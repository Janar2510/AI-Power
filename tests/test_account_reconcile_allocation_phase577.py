"""Phase 577: account.reconcile.allocation model registered with account module."""

import unittest
from pathlib import Path

from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.orm.models import ModelBase
from core.tools.config import parse_config


class TestAccountReconcileAllocationPhase577(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.registry = Registry("_test_phase577_alloc")
        ModelBase._registry = cls.registry
        clear_loaded_addon_modules()
        load_module_graph()

    def test_model_registered(self):
        M = self.registry.get("account.reconcile.allocation")
        self.assertIsNotNone(M)
        self.assertEqual(M._name, "account.reconcile.allocation")

    def test_wizard_line_has_allocate_amount(self):
        WL = self.registry.get("account.reconcile.wizard.line")
        self.assertIsNotNone(WL)
        fields = WL.fields_get()
        self.assertIn("allocate_amount", fields)
