"""Phase 543: RAG_REINDEX_MODELS includes agreed cron scope."""

import unittest
from pathlib import Path

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.orm.models import ModelBase


class TestAiRagScopePhase543(unittest.TestCase):
    _addons_path = str((Path(__file__).resolve().parent.parent / "addons").resolve())

    def test_rag_reindex_models_tuple(self):
        parse_config(["--addons-path=" + self._addons_path])
        registry = Registry("_test_phase543_rag")
        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        from addons.ai_assistant.models import rag_reindex

        models = rag_reindex.RAG_REINDEX_MODELS
        self.assertIsInstance(models, tuple)
        for name in ("res.partner", "crm.lead", "knowledge.article", "sale.order"):
            self.assertIn(name, models)
