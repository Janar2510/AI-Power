"""Phase 163: Statusbar widget + workflow buttons."""

import unittest

from core.tools.config import parse_config
from core.modules import load_module_graph
from core.orm import Registry, Environment
from core.orm.models import ModelBase
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from core.http.rpc import _call_kw


def _ensure_test_db(dbname: str) -> bool:
    parse_config(["--addons-path=addons"])
    return db_exists(dbname)


class TestStatusbarPhase163(unittest.TestCase):
    """Phase 163: statusbar widget for Selection state fields."""

    @classmethod
    def setUpClass(cls):
        parse_config(["--addons-path=addons"])
        cls.db = "_test_rpc_read"
        cls._has_db = _ensure_test_db(cls.db)

    def test_sale_order_form_has_statusbar_field(self):
        """sale.order form view declares state with widget=statusbar."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        from core.data.views_registry import load_views_registry
        reg = load_views_registry()
        views = reg.get("views", {}).get("sale.order", [])
        form_view = next((v for v in views if v.get("type") == "form"), None)
        self.assertIsNotNone(form_view, "sale.order should have form view")
        flat_fields = form_view.get("fields", [])
        state_field = next((f for f in flat_fields if f.get("name") == "state"), None)
        self.assertIsNotNone(state_field, "form should have state field")
        self.assertEqual(state_field.get("widget"), "statusbar", "state should have widget=statusbar")

    def test_sale_order_state_selection_values(self):
        """sale.order state has draft, sale, cancel - statusbar can display them."""
        if not self._has_db:
            self.skipTest("DB _test_rpc_read not found; run: ./erp-bin db init -d _test_rpc_read")
        fields = _call_kw(1, self.db, "sale.order", "fields_get", [], {})
        self.assertIn("state", fields)
        sel = fields["state"].get("selection")
        self.assertIsNotNone(sel)
        values = [s[0] for s in sel]
        self.assertIn("draft", values)
        self.assertIn("sale", values)
        self.assertIn("cancel", values)
