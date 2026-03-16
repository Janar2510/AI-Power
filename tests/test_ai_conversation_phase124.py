"""Phase 124: AI Conversation Memory - ai.conversation model and stateful /ai/chat."""

import json
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

from werkzeug.test import EnvironBuilder

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from core.http.request import Request as ERPRequest
from core.http.session import create_session


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestAiConversationPhase124(unittest.TestCase):
    """Test ai.conversation model and /ai/chat conversation_id flow."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)
        if cls._has_db:
            parse_config(["--addons-path=" + str(addons_path)])
            registry = Registry(cls.db)
            from core.orm.models import ModelBase
            ModelBase._registry = registry
            clear_loaded_addon_modules()
            load_module_graph()
            with get_cursor(cls.db) as cr:
                init_schema(cr, registry)
                load_default_data(Environment(registry, cr=cr, uid=1))

    def _make_request(self, path, method="GET", data=None):
        sid = create_session(1, self.db)
        if method == "POST" and data is not None:
            builder = EnvironBuilder(path=path, method=method, data=json.dumps(data))
            builder.headers["Content-Type"] = "application/json"
        else:
            builder = EnvironBuilder(path=path, method=method)
        builder.headers["Cookie"] = "erp_session=" + sid
        return ERPRequest(builder.get_environ())

    def test_ai_conversation_model_exists(self):
        """ai.conversation model is registered and has expected fields."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found")
        parse_config(["--addons-path=" + self._addons_path])
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        now = datetime.now(timezone.utc).isoformat()
        with get_cursor(self.db) as cr:
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            Conv = env.get("ai.conversation")
            self.assertIsNotNone(Conv)
            rec = Conv.create({
                "user_id": 1,
                "messages": '[{"role":"user","content":"hi"},{"role":"assistant","content":"hello"}]',
                "model_context": "crm.lead",
                "active_id": 5,
                "create_date": now,
                "write_date": now,
            })
        self.assertIsNotNone(rec)
        conv_id = rec.id if hasattr(rec, "id") else (rec.get("id") if isinstance(rec, dict) else None)
        self.assertIsNotNone(conv_id)
        with get_cursor(self.db) as cr:
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            Conv = env.get("ai.conversation")
            rows = Conv.search_read([("id", "=", conv_id)], ["user_id", "messages", "model_context", "active_id"])
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["user_id"], 1)
        self.assertEqual(rows[0]["model_context"], "crm.lead")
        self.assertEqual(rows[0]["active_id"], 5)

    def test_ai_chat_returns_conversation_id_when_llm_enabled(self):
        """POST /ai/chat with LLM enabled returns conversation_id in response."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found")
        from addons.ai_assistant.controllers import ai_controller
        with patch.object(ai_controller, "_get_llm_config", return_value={"llm_enabled": "1", "llm_model": "gpt-4o-mini"}):
            with patch.object(ai_controller, "retrieve_chunks", return_value=[]):
                with patch.object(ai_controller, "call_llm", return_value=("Hello!", [])):
                    req = self._make_request("/ai/chat", method="POST", data={"prompt": "Hi"})
                    r = ai_controller.ai_chat(req)
        self.assertEqual(r.status_code, 200, r.get_data(as_text=True))
        data = json.loads(r.get_data(as_text=True))
        self.assertIn("conversation_id", data)
        self.assertIsNotNone(data["conversation_id"])
        self.assertEqual(data["result"], "Hello!")

    def test_ai_chat_accepts_conversation_id_and_model_context(self):
        """POST /ai/chat accepts conversation_id, model_context, active_id without error."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found")
        from addons.ai_assistant.controllers import ai_controller
        with patch.object(ai_controller, "_get_llm_config", return_value={"llm_enabled": "1", "llm_model": "gpt-4o-mini"}):
            with patch.object(ai_controller, "retrieve_chunks", return_value=[]):
                with patch.object(ai_controller, "call_llm", return_value=("Got it.", [])) as mock_llm:
                    req = self._make_request("/ai/chat", method="POST", data={
                        "prompt": "What am I viewing?",
                        "conversation_id": 999,
                        "model_context": "crm.lead",
                        "active_id": 42,
                    })
                    r = ai_controller.ai_chat(req)
        self.assertEqual(r.status_code, 200, r.get_data(as_text=True))
        data = json.loads(r.get_data(as_text=True))
        self.assertIn("result", data)
        call_args = mock_llm.call_args
        messages = call_args[0][1]
        system_content = next((m["content"] for m in messages if m.get("role") == "system"), "")
        self.assertIn("crm.lead", system_content)
        self.assertIn("42", system_content)
