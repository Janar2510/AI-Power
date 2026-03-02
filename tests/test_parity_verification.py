"""Parity verification tests - module lifecycle, security invariants.

Validates Odoo 19.0 parity invariants per next-phase-plan and parity_matrix.
"""

import unittest

from core.modules.module import resolve_load_order
from core.modules.loader import load_module_graph
from core.orm.security import (
    build_access_map,
    check_access,
    load_access_from_module,
    parse_ir_model_access_csv,
)
from core.tools.config import parse_config, get_addons_paths


class TestModuleLifecycle(unittest.TestCase):
    """Verify module lifecycle invariants."""

    def setUp(self):
        parse_config(["--addons-path=addons"])

    def test_resolve_load_order_base_before_dependents(self):
        """Base must load before modules that depend on it."""
        order = resolve_load_order(["demo_module", "base"])
        base_idx = order.index("base")
        demo_idx = order.index("demo_module")
        self.assertLess(base_idx, demo_idx, "base must load before demo_module")

    def test_resolve_load_order_acyclic(self):
        """Load order must be acyclic and stable."""
        order = resolve_load_order(["web", "base", "demo_module"])
        self.assertIn("base", order)
        self.assertIn("web", order)
        self.assertEqual(len(order), len(set(order)), "No duplicates")

    def test_load_module_graph_returns_loaded_names(self):
        """load_module_graph returns successfully loaded module names."""
        loaded = load_module_graph(server_wide=["base", "web"])
        self.assertIn("base", loaded)
        self.assertIn("web", loaded)


class TestSecurityInvariants(unittest.TestCase):
    """Verify security invariants (ir.model.access, default-allow)."""

    def setUp(self):
        parse_config(["--addons-path=addons"])

    def test_parse_ir_model_access_csv(self):
        """Parse ir.model.access.csv format."""
        csv_content = """id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_res_partner,res.partner,model_res_partner,,1,1,1,1"""
        entries = parse_ir_model_access_csv(csv_content)
        # Parser may include header row as data when fieldnames given; get valid entry
        valid = [e for e in entries if e[0] == "res.partner"]
        self.assertGreaterEqual(len(valid), 1)
        model, group, r, w, c, u = valid[0]
        self.assertEqual(model, "res.partner")
        self.assertTrue(r and w and c and u)

    def test_build_access_map_loads_from_modules(self):
        """build_access_map loads from module security dirs."""
        paths = get_addons_paths()
        access_map = build_access_map(paths)
        self.assertIn("res.partner", access_map)
        self.assertIn("res.users", access_map)

    def test_check_access_default_allow_when_no_rules(self):
        """No rules for model = allow (default-allow MVP)."""
        access_map = {}
        self.assertTrue(check_access(access_map, "unknown.model", "read"))

    def test_check_access_denies_when_no_matching_rule(self):
        """When rules exist but none match, deny."""
        # Model with rules that require specific group
        access_map = {"res.partner": [("base.group_user", "read")]}
        # User with no groups
        self.assertFalse(check_access(access_map, "res.partner", "read", user_groups=set()))

    def test_check_access_allows_when_rule_matches(self):
        """When rule matches group, allow."""
        access_map = {"res.partner": [("base.group_user", "read"), ("", "write")]}
        self.assertTrue(check_access(access_map, "res.partner", "read", user_groups={"base.group_user"}))
        self.assertTrue(check_access(access_map, "res.partner", "write", user_groups=set()))
