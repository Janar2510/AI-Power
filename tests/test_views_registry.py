"""Tests for views registry (data-driven views)."""

import json
import unittest

from core.tools import config
from core.data.views_registry import (
    load_views_registry,
    load_views_registry_from_db,
    get_view_for_model,
)


class TestViewsRegistry(unittest.TestCase):
    def setUp(self):
        config.parse_config(["--addons-path=addons"])

    def test_load_views_registry_has_res_partner(self):
        registry = load_views_registry()
        self.assertIn("views", registry)
        self.assertIn("res.partner", registry["views"])
        views = registry["views"]["res.partner"]
        self.assertGreater(len(views), 0)
        list_view = next((v for v in views if v["type"] == "list"), None)
        self.assertIsNotNone(list_view)
        self.assertIn("columns", list_view)
        self.assertIn("name", [c.get("name") for c in list_view["columns"]])

    def test_load_views_registry_has_crm_lead(self):
        registry = load_views_registry()
        self.assertIn("crm.lead", registry.get("views", {}))
        views = registry["views"]["crm.lead"]
        self.assertGreater(len(views), 0)
        list_view = next((v for v in views if v["type"] == "list"), None)
        self.assertIsNotNone(list_view)
        self.assertIn("stage_id", [c.get("name") for c in list_view["columns"]])

    def test_load_views_registry_has_actions(self):
        registry = load_views_registry()
        self.assertIn("actions", registry)
        self.assertIn("base.action_partner", registry["actions"])
        action = registry["actions"]["base.action_partner"]
        self.assertEqual(action["res_model"], "res.partner")
        self.assertIn("list", action["view_mode"])

    def test_load_views_registry_has_menus(self):
        registry = load_views_registry()
        self.assertIn("menus", registry)
        menus = [m for m in registry["menus"] if m.get("action") == "base.action_partner"]
        self.assertGreater(len(menus), 0)
        self.assertEqual(menus[0]["name"], "Contacts")

    def test_load_views_registry_has_home_menu(self):
        registry = load_views_registry()
        home = next((m for m in registry["menus"] if m.get("name") == "Home"), None)
        self.assertIsNotNone(home)
        self.assertEqual(home.get("action"), "")

    def test_load_views_registry_from_db_uses_db_actions_menus(self):
        """load_views_registry_from_db returns actions and menus from DB when env provides them (Phase 40)."""
        class MockActWindow:
            @classmethod
            def search_read(cls, domain=None, fields=None, offset=0, limit=None, order=None):
                return [
                    {
                        "id": 1,
                        "xml_id": "base.action_partner",
                        "name": "Contacts",
                        "res_model": "res.partner",
                        "view_mode": "list,form",
                    },
                ]

        class MockMenu:
            @classmethod
            def search_read(cls, domain=None, fields=None, offset=0, limit=None, order=None):
                return [
                    {
                        "id": 1,
                        "xml_id": "base.menu_contacts",
                        "name": "Contacts",
                        "action_ref": "base.action_partner",
                        "parent_ref": "",
                        "sequence": 10,
                    },
                ]

        class MockEnv:
            def get(self, name, default=None):
                if name == "ir.actions.act_window":
                    return MockActWindow
                if name == "ir.ui.menu":
                    return MockMenu
                return default

        reg = load_views_registry_from_db(MockEnv())
        self.assertIn("views", reg)
        self.assertIn("actions", reg)
        self.assertIn("base.action_partner", reg["actions"])
        self.assertEqual(reg["actions"]["base.action_partner"]["res_model"], "res.partner")
        self.assertIn("menus", reg)
        contacts_menu = next(
            (m for m in reg["menus"] if m.get("action") == "base.action_partner"),
            None,
        )
        self.assertIsNotNone(contacts_menu)
        self.assertEqual(contacts_menu["name"], "Contacts")
