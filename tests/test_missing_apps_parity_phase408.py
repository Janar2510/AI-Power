"""Phase 408: Missing apps parity (CRM/Discuss/HR app promotion + app scaffolds)."""

import unittest
from pathlib import Path


class TestMissingAppsParityPhase408(unittest.TestCase):
    """Verify parity scaffolding for missing app tiles and routes."""

    @classmethod
    def setUpClass(cls):
        cls.root = Path(__file__).resolve().parent.parent

    def _read(self, rel_path: str) -> str:
        return (self.root / rel_path).read_text(encoding="utf-8")

    def test_crm_menu_hierarchy_exists(self):
        xml = self._read("addons/crm/views/crm_views.xml")
        self.assertIn('id="crm_menu_root"', xml)
        self.assertIn('id="crm_menu_sales"', xml)
        self.assertIn('id="menu_crm_opportunities"', xml)
        self.assertIn('id="crm_menu_report"', xml)
        self.assertIn('id="crm_menu_config"', xml)

    def test_discuss_menu_root_exists(self):
        xml = self._read("addons/mail/views/mail_template_views.xml")
        self.assertIn('id="menu_discuss_root"', xml)
        self.assertIn('name="Discuss"', xml)

    def test_hr_promoted_app_roots_exist(self):
        expense_xml = self._read("addons/hr_expense/views/hr_expense_views.xml")
        self.assertIn('id="menu_hr_expense_root"', expense_xml)
        self.assertIn('name="My Expenses"', expense_xml)

        attendance_xml = self._read("addons/hr_attendance/views/hr_attendance_views.xml")
        self.assertIn('id="menu_hr_attendance_root"', attendance_xml)
        self.assertIn('name="Attendances"', attendance_xml)

        recruitment_xml = self._read("addons/hr_recruitment/views/hr_recruitment_views.xml")
        self.assertIn('id="menu_hr_recruitment_root"', recruitment_xml)
        self.assertIn('name="Recruitment"', recruitment_xml)

        holidays_manifest = self._read("addons/hr_holidays/__manifest__.py")
        holidays_xml = self._read("addons/hr_holidays/views/hr_holidays_views.xml")
        self.assertIn("views/hr_holidays_views.xml", holidays_manifest)
        self.assertIn('id="menu_hr_holidays_root"', holidays_xml)

    def test_analytic_moved_under_invoicing_config(self):
        xml = self._read("addons/analytic/views/analytic_views.xml")
        self.assertIn('<field name="parent_id" ref="account.menu_account_config"/>', xml)

    def test_scaffold_modules_have_view_files_and_root_menus(self):
        modules = [
            ("addons/repair/views/repair_views.xml", "menu_repair_root"),
            ("addons/survey/views/survey_views.xml", "menu_survey_root"),
            ("addons/lunch/views/lunch_views.xml", "menu_lunch_root"),
            ("addons/im_livechat/views/im_livechat_views.xml", "menu_im_livechat_root"),
            ("addons/project_todo/views/project_todo_views.xml", "menu_project_todo_root"),
            ("addons/data_recycle/views/data_recycle_views.xml", "menu_data_recycle_root"),
            ("addons/hr_skills/views/hr_skills_views.xml", "menu_hr_skills_root"),
        ]
        for rel, menu_id in modules:
            text = self._read(rel)
            self.assertIn(menu_id, text, rel)

    def test_main_js_has_new_route_mappings(self):
        js = self._read("addons/web/static/src/main.js")
        expected_markers = [
            "return 'pipeline';",
            "return 'crm/activities';",
            "name === 'crm'",
            "name === 'discuss'",
            "name === 'expenses'",
            "name === 'attendances'",
            "name === 'recruitment'",
            "name === 'time off'",
            "name === 'repairs'",
            "name === 'surveys'",
            "name === 'lunch'",
            "name === 'live chat'",
            "name === 'to-do'",
            "name === 'data recycle'",
            "name === 'skills'",
            "route === 'pipeline'",
            "route === 'crm/activities'",
            "route === 'expenses'",
            "route === 'attendances'",
            "route === 'recruitment'",
            "route === 'time_off'",
            "route === 'repair_orders'",
            "route === 'surveys'",
            "route === 'lunch_orders'",
            "route === 'livechat_channels'",
            "route === 'project_todos'",
            "route === 'recycle_models'",
            "route === 'skills'",
        ]
        for marker in expected_markers:
            self.assertIn(marker, js)


if __name__ == "__main__":
    unittest.main()
