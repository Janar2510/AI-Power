"""Phase 122: AI Natural Language Search - nl_search tool and POST /ai/nl_search."""

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


class TestAiNlSearchPhase122(unittest.TestCase):
    """Test nl_search tool and /ai/nl_search endpoint."""

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

    def test_nl_search_fallback_returns_domain_and_results(self):
        """nl_search with use_llm=False uses ilike fallback; returns domain and results."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
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
            from addons.ai_assistant.tools.registry import nl_search
            result = nl_search(env, model="res.partner", query="acme", limit=5, use_llm=False)
        self.assertIn("domain", result)
        self.assertIn("results", result)
        self.assertIsInstance(result["domain"], list)
        self.assertIsInstance(result["results"], list)
        self.assertTrue(
            len(result["domain"]) > 0,
            "Fallback domain should be non-empty for non-empty query",
        )

    def test_nl_search_unknown_model_returns_empty_results(self):
        """nl_search with unknown model returns empty results."""
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
            from addons.ai_assistant.tools.registry import nl_search
            result = nl_search(env, model="nonexistent.model", query="test", use_llm=False)
        self.assertEqual(result["results"], [])
        self.assertIn("domain", result)

    def test_ai_nl_search_401_without_auth(self):
        """POST /ai/nl_search returns 401 when not authenticated."""
        from core.http import Application
        app = Application()
        builder = EnvironBuilder(path="/ai/nl_search", method="POST", data=json.dumps({"model": "res.partner", "query": "test"}))
        builder.headers["Content-Type"] = "application/json"
        req = ERPRequest(builder.get_environ())
        from addons.ai_assistant.controllers.ai_controller import ai_nl_search
        r = ai_nl_search(req)
        self.assertEqual(r.status_code, 401)

    def test_ai_nl_search_200_with_auth(self):
        """POST /ai/nl_search returns domain and results when authenticated."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found")
        req = self._make_request("/ai/nl_search", method="POST", data={"model": "res.partner", "query": "test"})
        from addons.ai_assistant.controllers.ai_controller import ai_nl_search
        r = ai_nl_search(req)
        self.assertEqual(r.status_code, 200, r.get_data(as_text=True))
        data = json.loads(r.get_data(as_text=True))
        self.assertIn("domain", data)
        self.assertIn("results", data)
        self.assertIsInstance(data["domain"], list)
        self.assertIsInstance(data["results"], list)

    def test_ai_nl_search_400_missing_model(self):
        """POST /ai/nl_search returns 400 when model is missing."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found")
        req = self._make_request("/ai/nl_search", method="POST", data={"query": "test"})
        from addons.ai_assistant.controllers.ai_controller import ai_nl_search
        r = ai_nl_search(req)
        self.assertEqual(r.status_code, 400)
        data = json.loads(r.get_data(as_text=True))
        self.assertIn("model", data.get("error", "").lower())
