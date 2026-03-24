"""Phase 547: embedding_column_is_pgvector_type guards RAG SQL."""

import importlib.util
import unittest
from pathlib import Path
from unittest.mock import MagicMock

# Load pipeline without importing addons.ai_assistant (avoids werkzeug via controllers).
_PIPELINE = Path(__file__).resolve().parent.parent / "addons" / "ai_assistant" / "embeddings" / "pipeline.py"
_spec = importlib.util.spec_from_file_location("_erp_test_embed_pipeline_547", _PIPELINE)
_mod = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
_spec.loader.exec_module(_mod)
embedding_column_is_pgvector_type = _mod.embedding_column_is_pgvector_type


class TestEmbeddingColumnPhase547(unittest.TestCase):
    def test_false_when_no_row(self):
        cr = MagicMock()
        cr.fetchone.return_value = None
        self.assertFalse(embedding_column_is_pgvector_type(cr, "ai_document_chunk", "embedding"))

    def test_true_when_udt_vector(self):
        cr = MagicMock()
        cr.fetchone.return_value = {"udt_name": "vector"}
        self.assertTrue(embedding_column_is_pgvector_type(cr, "t", "embedding"))

    def test_false_when_jsonb(self):
        cr = MagicMock()
        cr.fetchone.return_value = {"udt_name": "jsonb"}
        self.assertFalse(embedding_column_is_pgvector_type(cr, "t", "embedding"))
