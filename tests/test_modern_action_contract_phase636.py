"""Phase 636–639: modular action service contract (services.js + sidebar wiring)."""

import re
import unittest
from pathlib import Path


class TestModernActionContractPhase636(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root = Path(__file__).resolve().parent.parent
        cls.services = (cls.root / "addons/web/static/src/app/services.js").read_text(encoding="utf-8")
        cls.sidebar = (cls.root / "addons/web/static/src/app/sidebar.js").read_text(encoding="utf-8")
        cls.main_app = (cls.root / "addons/web/static/src/app/main.js").read_text(encoding="utf-8")
        cls.view_manager = (cls.root / "addons/web/static/src/core/view_manager.js").read_text(encoding="utf-8")
        cls.legacy_main = (cls.root / "addons/web/static/src/main.js").read_text(encoding="utf-8")

    def test_services_imports_menu_to_route(self):
        self.assertRegex(self.services, r"menuToRoute,")

    def test_action_service_has_navigate_from_menu(self):
        self.assertIn("navigateFromMenu(menu)", self.services)

    def test_action_service_has_do_action_button(self):
        self.assertIn("doActionButton(opts)", self.services)

    def test_do_action_navigates_after_legacy_window(self):
        self.assertIn("navigateForActWindow", self.services)
        self.assertIn("isWindowType", self.services)
        self.assertIn("windowPayload", self.services)

    def test_sidebar_links_carry_menu_id(self):
        self.assertIn('data-menu-id="', self.sidebar)
        self.assertIn("navigateFromMenu", self.sidebar)

    def test_sidebar_wire_passes_env(self):
        self.assertRegex(self.sidebar, r"wireSidebar\(host,\s*env\)")

    def test_runtime_exposes_action(self):
        self.assertIn("action: env.services.action", self.main_app)

    def test_phase649_view_manager_open_from_act_window(self):
        self.assertIn("openFromActWindow(action, options)", self.view_manager)
        self.assertIn("env.services.action", self.view_manager)

    def test_phase648_navigate_act_window_choke_point(self):
        self.assertIn("function navigateActWindowIfAvailable", self.legacy_main)
        self.assertIn("navigateActWindowIfAvailable(nav && nav.action", self.legacy_main)
        self.assertIn("source: 'sidebar'", self.legacy_main)

    def test_phase649_action_service_open_from_act_window_bridge(self):
        self.assertIn("openFromActWindow(actionDef, options)", self.services)

    def test_phase658_dispatch_act_window_for_list_route(self):
        self.assertIn("function dispatchActWindowForListRoute", self.legacy_main)
        self.assertIn("source: 'routeApplyList'", self.legacy_main)

    def test_phase659_form_save_dispatches_list_action(self):
        self.assertIn("source: 'formSaveReturnList'", self.legacy_main)
        self.assertIn("dispatchActWindowForListRoute(route", self.legacy_main)

    def test_phase668_alt_k_dispatches_list_action(self):
        self.assertIn("source: 'shortcutAltK'", self.legacy_main)
        self.assertRegex(
            self.legacy_main,
            r"dispatchActWindowForListRoute\(routeKanban,\s*\{\s*source:\s*'shortcutAltK'\s*\}\)",
        )

    def test_phase682_view_manager_sync_list_route_from_main(self):
        self.assertIn("syncListRouteFromMain", self.view_manager)
        self.assertRegex(
            self.legacy_main,
            r"syncListRouteFromMain\(route,\s*getActionForRoute",
        )

    def test_phase680_set_view_reload_dispatches_list_action(self):
        self.assertIn("source: 'listViewSwitch'", self.legacy_main)
        self.assertIn("dispatchActWindowForListRoute(route, { source: 'listViewSwitch' })", self.legacy_main)


if __name__ == "__main__":
    unittest.main()
