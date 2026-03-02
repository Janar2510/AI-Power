"""Tests for config module."""

import unittest

from core.tools.config import (
    _parse_config,
    get_addons_paths,
    parse_config,
    DEFAULT_SERVER_WIDE_MODULES,
)


class TestConfig(unittest.TestCase):
    def test_parse_config_defaults(self):
        cfg = _parse_config([])
        self.assertEqual(cfg["http_port"], 8069)
        self.assertEqual(cfg["gevent_port"], 8072)
        self.assertFalse(cfg["proxy_mode"])
        self.assertFalse(cfg["test_enable"])

    def test_parse_config_addons_path(self):
        cfg = _parse_config(["--addons-path=addons,other"])
        self.assertEqual(len(cfg["addons_path"]), 2)
        self.assertIn("addons", cfg["addons_path"][0])
        self.assertIn("other", cfg["addons_path"][1])

    def test_parse_config_http_port(self):
        cfg = _parse_config(["--http-port=9000"])
        self.assertEqual(cfg["http_port"], 9000)

    def test_default_server_wide_modules(self):
        self.assertIn("base", DEFAULT_SERVER_WIDE_MODULES)
        self.assertIn("web", DEFAULT_SERVER_WIDE_MODULES)
