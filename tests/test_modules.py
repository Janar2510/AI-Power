"""Tests for module loader."""

import unittest

from core.modules.module import (
    get_manifest,
    get_modules,
    get_module_path,
    resolve_load_order,
)
from core.tools.config import parse_config


class TestModules(unittest.TestCase):
    def setUp(self):
        parse_config(["--addons-path=addons"])

    def test_get_modules(self):
        modules = get_modules()
        self.assertIn("base", modules)
        self.assertIn("web", modules)

    def test_get_manifest_base(self):
        manifest = get_manifest("base")
        self.assertEqual(manifest["name"], "Base")
        self.assertEqual(manifest["version"], "1.0")
        self.assertEqual(manifest["depends"], [])

    def test_get_module_path(self):
        path = get_module_path("base")
        self.assertIsNotNone(path)
        self.assertTrue(path.name == "base")
        self.assertTrue((path / "__manifest__.py").exists())

    def test_resolve_load_order(self):
        order = resolve_load_order(["demo_module", "base"])
        self.assertLess(order.index("base"), order.index("demo_module"))

    def test_resolve_load_order_expands_missing_dependencies(self):
        order = resolve_load_order(["my_module"])
        self.assertIn("base", order)
        self.assertLess(order.index("base"), order.index("my_module"))
