"""Phase 590: parallel backend track — CRM configuration surface regression (static)."""

import unittest
from pathlib import Path


class TestParallelTrackBePhase590(unittest.TestCase):
    """Ensure CRM Configuration menus (Stages, Tags, Lost Reasons) have act_window targets."""

    @classmethod
    def setUpClass(cls):
        cls.root = Path(__file__).resolve().parent.parent

    def _read(self, rel: str) -> str:
        return (self.root / rel).read_text(encoding="utf-8")

    def test_crm_config_act_windows_and_menus(self):
        xml = self._read("addons/crm/views/crm_views.xml")
        for aid in ("action_crm_stage", "action_crm_tag", "action_crm_lost_reason"):
            self.assertIn(f'id="{aid}"', xml, msg=f"missing {aid}")
        self.assertIn('parent="crm_menu_config"', xml)
        self.assertIn('id="menu_crm_stage_config"', xml)
        self.assertIn('id="menu_crm_tag_config"', xml)
        self.assertIn('id="menu_crm_lost_reason_config"', xml)

    def test_crm_lost_reason_model_registered(self):
        init_py = self._read("addons/crm/models/__init__.py")
        self.assertIn("crm_lost_reason", init_py)
        model_py = self._read("addons/crm/models/crm_lost_reason.py")
        self.assertIn('_name = "crm.lost.reason"', model_py)
