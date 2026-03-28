"""Phase 739 regression: recover from cached empty HTTP registry."""

import unittest
from unittest import mock

from core.http import auth


class _FakeRegistry:
    def __init__(self, db_name: str):
        self.db_name = db_name
        self._models = {}
        self._env = None

    def register_model(self, model_name, model_class):
        self._models[model_name] = model_class

    def keys(self):
        return list(self._models.keys())

    def set_env(self, env):
        self._env = env


class TestAuthRegistryRecoveryPhase739(unittest.TestCase):
    def test_get_registry_rebuilds_cached_empty_registry(self):
        built = []
        empty_cached = _FakeRegistry("erp")
        self.assertEqual(empty_cached.keys(), [])

        def fake_registry(db_name):
            reg = _FakeRegistry(db_name)
            built.append(reg)
            return reg

        def fake_load_module_graph():
            current = auth.ModelBase._registry
            current.register_model("res.users", object())

        with mock.patch.object(auth, "Registry", side_effect=fake_registry), \
             mock.patch.object(auth, "load_module_graph", side_effect=fake_load_module_graph), \
             mock.patch.dict(auth._registries, {"erp": empty_cached}, clear=True):
            reg = auth._get_registry("erp")

        self.assertEqual(len(built), 1)
        self.assertIn("res.users", reg.keys())
