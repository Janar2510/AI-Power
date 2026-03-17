"""Phase 174: Excel Export."""

import unittest

from core.tools.config import parse_config
from core.modules import load_module_graph
from core.orm import Registry, Environment
from core.orm.models import ModelBase
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists


def _ensure_test_db(dbname: str) -> bool:
    parse_config(["--addons-path=addons"])
    return db_exists(dbname)


class TestExcelExportPhase174(unittest.TestCase):
    """Phase 174: Server-side Excel export via /web/export/xlsx."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)

    def test_export_xlsx_requires_auth(self):
        """POST /web/export/xlsx returns 401 without session."""
        from werkzeug.test import Client
        from core.http import Application
        app = Application()
        client = Client(app)
        r = client.post(
            "/web/export/xlsx",
            data='{"model":"res.partner","fields":["id","name"],"domain":[]}',
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 401)
