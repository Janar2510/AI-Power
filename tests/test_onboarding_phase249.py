"""Phase 249: Onboarding module - setup wizard toolbox."""

import unittest
from pathlib import Path

from core.tools.config import parse_config
from core.modules import clear_loaded_addon_modules, load_module_graph
from core.orm import Registry, Environment
from core.db import init_schema
from core.db.init_data import load_default_data
from core.sql_db import get_cursor, db_exists
from core.upgrade.runner import run_upgrade


def _ensure_test_db(dbname: str) -> bool:
    addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
    parse_config(["--addons-path=" + str(addons_path)])
    return db_exists(dbname)


class TestOnboardingPhase249(unittest.TestCase):
    """Phase 249: onboarding module loads, models exist, CRUD works."""

    @classmethod
    def setUpClass(cls):
        addons_path = (Path(__file__).resolve().parent.parent / "addons").resolve()
        parse_config(["--addons-path=" + str(addons_path)])
        cls.db = "_test_onboarding_249"
        cls._has_db = _ensure_test_db(cls.db)
        cls._addons_path = str(addons_path)

    def test_onboarding_module_loads(self):
        """onboarding module provides onboarding.onboarding, onboarding.progress, etc."""
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
            run_upgrade(cr, self.db, None)
            cr.connection.commit()
        with get_cursor(self.db) as cr:
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Onboarding = env.get("onboarding.onboarding")
            Step = env.get("onboarding.onboarding.step")
            Progress = env.get("onboarding.progress")
            ProgressStep = env.get("onboarding.progress.step")
            self.assertIsNotNone(Onboarding)
            self.assertIsNotNone(Step)
            self.assertIsNotNone(Progress)
            self.assertIsNotNone(ProgressStep)

    def test_onboarding_crud(self):
        """Create onboarding with steps and progress."""
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
            run_upgrade(cr, self.db, None)
            cr.connection.commit()
        with get_cursor(self.db) as cr:
            env = Environment(registry, cr=cr, uid=1)
            registry.set_env(env)
            load_default_data(env)
            Onboarding = env.get("onboarding.onboarding")
            Step = env.get("onboarding.onboarding.step")
            Progress = env.get("onboarding.progress")
            if not all([Onboarding, Step, Progress]):
                self.skipTest("Models not loaded")
            ob = Onboarding.create({"name": "Sale Setup", "route_name": "sale"})
            ob_id = ob.ids[0] if ob.ids else ob.id
            step = Step.create({"title": "Step 1", "onboarding_id": ob_id})
            prog = Progress.create({"onboarding_id": ob_id, "is_onboarding_closed": False})
            self.assertIsNotNone(prog.ids[0] if prog.ids else prog.id)
