"""Tests for AI LLM integration (Phase 88)."""

import json
import unittest
from unittest.mock import patch

from werkzeug.test import EnvironBuilder

from core.tools.config import parse_config
from core.sql_db import db_exists
from core.http import Application
from core.http.session import create_session
from core.http.request import Request as ERPRequest


def _has_test_db():
    parse_config(["--addons-path=addons"])
    return db_exists("_test_rpc_read")


class TestAiLlm(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = db_exists(cls.db)

    def _make_request(self, path, method="GET", data=None):
        """Create Request with session cookie (same pattern as test_report)."""
        sid = create_session(1, self.db)
        if method == "POST" and data is not None:
            builder = EnvironBuilder(path=path, method=method, data=json.dumps(data))
            builder.headers["Content-Type"] = "application/json"
        else:
            builder = EnvironBuilder(path=path, method=method)
        builder.headers["Cookie"] = "erp_session=" + sid
        return ERPRequest(builder.get_environ())

    def test_ai_chat_requires_tool_when_llm_disabled(self):
        """When llm_enabled=0, /ai/chat requires tool parameter."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found")
        with patch("addons.ai_assistant.controllers.ai_controller._get_llm_config") as mock_cfg:
            mock_cfg.return_value = {"llm_enabled": "0", "llm_model": "gpt-4o-mini"}
            req = self._make_request("/ai/chat", method="POST", data={"prompt": "hello"})
            from addons.ai_assistant.controllers.ai_controller import ai_chat
            r = ai_chat(req)
        self.assertIsNotNone(r)
        self.assertEqual(r.status_code, 400)
        data = json.loads(r.get_data(as_text=True))
        self.assertIn("tool required", data.get("error", "").lower())

    def test_ai_chat_llm_with_mock(self):
        """When llm_enabled=1, /ai/chat uses LLM; mock call_llm returns expected text."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found")
        with patch("addons.ai_assistant.controllers.ai_controller._get_llm_config") as mock_cfg:
            mock_cfg.return_value = {"llm_enabled": "1", "llm_model": "gpt-4o-mini"}
            with patch("addons.ai_assistant.controllers.ai_controller.retrieve_chunks", return_value=[]):
                with patch("addons.ai_assistant.controllers.ai_controller.call_llm") as mock_llm:
                    mock_llm.return_value = ("Mocked LLM response for testing.", [])
                    req = self._make_request("/ai/chat", method="POST", data={"prompt": "Show me leads"})
                    from addons.ai_assistant.controllers.ai_controller import ai_chat
                    r = ai_chat(req)
        self.assertIsNotNone(r)
        self.assertEqual(r.status_code, 200, r.get_data(as_text=True))
        data = json.loads(r.get_data(as_text=True))
        self.assertNotIn("error", data)
        self.assertEqual(data.get("result"), "Mocked LLM response for testing.")
        mock_llm.assert_called_once()
        call_args = mock_llm.call_args
        self.assertEqual(call_args[0][1][-1]["content"], "Show me leads")

    def test_ai_config_returns_llm_settings(self):
        """GET /ai/config returns llm_enabled and llm_model."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found")
        req = self._make_request("/ai/config", method="GET")
        from addons.ai_assistant.controllers.ai_controller import ai_config
        r = ai_config(req)
        self.assertEqual(r.status_code, 200)
        data = json.loads(r.get_data(as_text=True))
        self.assertIn("llm_enabled", data)
        self.assertIn("llm_model", data)

    def test_tool_schema_sync_phase218(self):
        """Phase 218: Every tool in TOOL_REGISTRY has a matching schema in _TOOL_SCHEMAS."""
        from addons.ai_assistant.tools.registry import TOOL_REGISTRY
        from addons.ai_assistant.llm import _TOOL_SCHEMAS
        missing = [name for name in TOOL_REGISTRY if name not in _TOOL_SCHEMAS]
        self.assertEqual(missing, [], f"Registry tools missing from _TOOL_SCHEMAS: {missing}")
