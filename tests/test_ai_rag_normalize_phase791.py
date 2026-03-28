"""Phase C1: RAG index text normalization."""

import unittest

from addons.ai_assistant.tools.rag_text import normalize_rag_index_text, RAG_INDEX_MAX_CHARS


class TestAiRagNormalizePhase791(unittest.TestCase):
    def test_short_text_unchanged(self):
        self.assertEqual(normalize_rag_index_text("hello"), "hello")

    def test_long_text_truncates_with_overlap_marker(self):
        raw = "x" * (RAG_INDEX_MAX_CHARS + 500)
        out = normalize_rag_index_text(raw)
        self.assertLessEqual(len(out), RAG_INDEX_MAX_CHARS + 10)
        self.assertIn("…", out)
