"""Phase 745: retrieve_chunks uses vector SQL only when extension + column type allow it."""

import unittest
from unittest.mock import MagicMock, patch


class _FakeEnv:
    def __init__(self, chunk_model, cr):
        self.cr = cr
        self._chunk = chunk_model

    def __getitem__(self, k):
        if k == "ai.document.chunk":
            return self._chunk
        raise KeyError(k)


class TestAiVectorSearchPhase745(unittest.TestCase):
    @patch("addons.ai_assistant.tools.registry._get_embedding")
    def test_retrieve_chunks_uses_ilike_when_extension_missing(self, mock_embed):
        from addons.ai_assistant.tools import registry as reg

        mock_embed.return_value = [0.1, 0.2, 0.3]
        chunk_model = MagicMock()
        chunk_model._table = "ai_document_chunk"
        cr = MagicMock()

        def exec_side(sql, params=None):
            s = str(sql)
            if "pg_extension" in s:
                cr.fetchone.return_value = None
            elif "information_schema" in s:
                cr.fetchone.return_value = {"udt_name": "vector"}

        cr.execute.side_effect = exec_side
        chunk_model.search_read.return_value = []
        env = _FakeEnv(chunk_model, cr)

        reg.retrieve_chunks(env, "hello", limit=5)
        chunk_model.search_read.assert_called()
        args, kwargs = chunk_model.search_read.call_args
        self.assertIn("ilike", str(kwargs.get("domain") or args))

    @patch("addons.ai_assistant.tools.registry._get_embedding")
    def test_retrieve_chunks_uses_vector_sql_when_ready(self, mock_embed):
        from addons.ai_assistant.tools import registry as reg

        mock_embed.return_value = [0.1, 0.2]
        chunk_model = MagicMock()
        chunk_model._table = "ai_document_chunk"
        cr = MagicMock()
        sql_log = []

        def exec_side(sql, params=None):
            sql_log.append(str(sql))
            s = str(sql)
            if "pg_extension" in s:
                cr.fetchone.return_value = (1,)
            elif "information_schema" in s:
                cr.fetchone.return_value = {"udt_name": "vector"}

        cr.execute.side_effect = exec_side
        cr.fetchall.return_value = []
        chunk_model.search_read.return_value = []
        env = _FakeEnv(chunk_model, cr)

        reg.retrieve_chunks(env, "q", limit=3)
        self.assertTrue(any("<=>" in s for s in sql_log), sql_log)
