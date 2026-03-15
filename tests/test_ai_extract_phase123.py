"""Phase 123: AI-Assisted Data Entry - extract_fields tool and POST /ai/extract_fields."""

import json
import unittest
from pathlib import Path

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


class TestAiExtractPhase123(unittest.TestCase):
    """Test extract_fields tool and /ai/extract_fields endpoint."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def _make_request(self, path, method="GET", data=None):
        sid = create_session(1, self.db)
        if method == "POST" and data is not None:
            builder = EnvironBuilder(path=path, method=method, data=json.dumps(data))
            builder.headers["Content-Type"] = "application/json"
        else:
            builder = EnvironBuilder(path=path, method=method)
        builder.headers["Cookie"] = "erp_session=" + sid
        return ERPRequest(builder.get_environ())

    def test_extract_fields_fallback_returns_email_phone(self):
        """extract_fields with use_llm=False uses regex fallback for email/phone."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found")
        parse_config(["--addons-path=" + self._addons_path])
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            from addons.ai_assistant.tools.registry import extract_fields
            text = "Contact: John Doe, john@example.com, +1 555-123-4567"
            result = extract_fields(env, model="res.partner", text=text, use_llm=False)
        self.assertIn("fields", result)
        self.assertIn("error", result)
        self.assertIsInstance(result["fields"], dict)
        self.assertIn("email", result["fields"])
        self.assertEqual(result["fields"]["email"], "john@example.com")
        self.assertIn("phone", result["fields"])

    def test_extract_fields_empty_text_returns_empty(self):
        """extract_fields with empty text returns empty fields."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found")
        parse_config(["--addons-path=" + self._addons_path])
        registry = Registry(self.db)
        from core.orm.models import ModelBase
        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        with get_cursor(self.db) as cr:
            init_schema(cr, registry)
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            from addons.ai_assistant.tools.registry import extract_fields
            result = extract_fields(env, model="res.partner", text="", use_llm=False)
        self.assertEqual(result["fields"], {})

    def test_ai_extract_fields_401_without_auth(self):
        """POST /ai/extract_fields returns 401 when not authenticated."""
        builder = EnvironBuilder(
            path="/ai/extract_fields",
            method="POST",
            data=json.dumps({"model": "res.partner", "text": "test@example.com"}),
        )
        builder.headers["Content-Type"] = "application/json"
        req = ERPRequest(builder.get_environ())
        from addons.ai_assistant.controllers.ai_controller import ai_extract_fields
        r = ai_extract_fields(req)
        self.assertEqual(r.status_code, 401)

    def test_ai_extract_fields_200_with_auth(self):
        """POST /ai/extract_fields returns fields when authenticated."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found")
        req = self._make_request(
            "/ai/extract_fields",
            method="POST",
            data={"model": "res.partner", "text": "Jane Smith jane@acme.com +44 20 7946 0958"},
        )
        from addons.ai_assistant.controllers.ai_controller import ai_extract_fields
        r = ai_extract_fields(req)
        self.assertEqual(r.status_code, 200, r.get_data(as_text=True))
        data = json.loads(r.get_data(as_text=True))
        self.assertIn("fields", data)
        self.assertIsInstance(data["fields"], dict)
        self.assertIn("email", data["fields"])
        self.assertEqual(data["fields"]["email"], "jane@acme.com")

    def test_ai_extract_fields_400_missing_model(self):
        """POST /ai/extract_fields returns 400 when model is missing."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found")
        req = self._make_request("/ai/extract_fields", method="POST", data={"text": "test"})
        from addons.ai_assistant.controllers.ai_controller import ai_extract_fields
        r = ai_extract_fields(req)
        self.assertEqual(r.status_code, 400)
        data = json.loads(r.get_data(as_text=True))
        self.assertIn("model", data.get("error", "").lower())
