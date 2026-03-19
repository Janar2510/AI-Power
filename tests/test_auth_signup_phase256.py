"""Phase 256: auth_signup module."""

import unittest
from pathlib import Path

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry
from core.orm.models import ModelBase


class TestAuthSignupPhase256(unittest.TestCase):
    """Test auth_signup module."""

    def test_auth_signup_extends_res_partner(self):
        """res.partner has signup_token, signup_type, signup_expiration."""
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        registry = Registry("_test_auth_signup_256")
        ModelBase._registry = registry
        clear_loaded_addon_modules()
        load_module_graph()
        Partner = registry._models.get("res.partner")
        self.assertIsNotNone(Partner)
        self.assertTrue(hasattr(Partner, "signup_token"))
        self.assertTrue(hasattr(Partner, "signup_type"))
        self.assertTrue(hasattr(Partner, "signup_expiration"))
