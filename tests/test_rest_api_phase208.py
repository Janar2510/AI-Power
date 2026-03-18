"""Phase 208: REST API v1."""

import json
import unittest

from werkzeug.test import Client
from werkzeug.wrappers import Response

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from pathlib import Path


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestRestApiPhase208(unittest.TestCase):
    """Test REST API v1."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_rest_openapi_spec(self):
        """GET /api/v1/openapi.json returns OpenAPI spec."""
        if not self._has_db:
            self.skipTest("DB not found")
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
            from addons.base.models.res_users_apikeys import ResUsersApikeys
            raw_key = ResUsersApikeys.generate(1, "REST Test")
        from core.http.application import Application
        from core.http.rest import rest_openapi
        from core.http.request import Request
        app = Application()
        env = {"REQUEST_METHOD": "GET", "PATH_INFO": "/api/v1/openapi.json", "HTTP_X_ODOO_DATABASE": self.db}
        req = Request(env)
        resp = rest_openapi(req)
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.get_data(as_text=True))
        self.assertIn("openapi", data)
        self.assertIn("paths", data)

    def test_rest_list_requires_auth(self):
        """GET /api/v1/res.partner without auth returns 401."""
        if not self._has_db:
            self.skipTest("DB not found")
        from core.http.rest import dispatch_rest
        from core.http.request import Request
        env = {
            "REQUEST_METHOD": "GET",
            "PATH_INFO": "/api/v1/res.partner",
            "QUERY_STRING": "",
            "HTTP_X_ODOO_DATABASE": self.db,
        }
        req = Request(env)
        resp = dispatch_rest(req)
        self.assertEqual(resp.status_code, 401)
