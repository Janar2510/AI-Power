"""Phase 745: pgvector_extension_installed helper."""

import unittest
from unittest.mock import MagicMock


class TestPgvectorExtensionInstalledPhase745(unittest.TestCase):
    def test_false_when_no_row(self):
        from addons.ai_assistant.embeddings.pipeline import pgvector_extension_installed

        cr = MagicMock()
        cr.fetchone.return_value = None
        self.assertFalse(pgvector_extension_installed(cr))
        cr.execute.assert_called()

    def test_true_when_row(self):
        from addons.ai_assistant.embeddings.pipeline import pgvector_extension_installed

        cr = MagicMock()
        cr.fetchone.return_value = (1,)
        self.assertTrue(pgvector_extension_installed(cr))
