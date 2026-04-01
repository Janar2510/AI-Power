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
        cls.legacy_form_views = (cls.root / "addons/web/static/src/legacy_main_form_views.js").read_text(
            encoding="utf-8"
        )
        cls.legacy_chart_views = (cls.root / "addons/web/static/src/legacy_main_chart_views.js").read_text(
            encoding="utf-8"
        )
        cls.list_view_module = (cls.root / "addons/web/static/src/app/list_view_module.js").read_text(
            encoding="utf-8"
        )
        cls.kanban_view_module = (cls.root / "addons/web/static/src/app/kanban_view_module.js").read_text(
            encoding="utf-8"
        )
        cls.legacy_list_views = (cls.root / "addons/web/static/src/legacy_main_list_views.js").read_text(
            encoding="utf-8"
        )
        cls.legacy_shell_routes = (cls.root / "addons/web/static/src/legacy_main_shell_routes.js").read_text(
            encoding="utf-8"
        )

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

    def test_runtime_exposes_view_phase691(self):
        self.assertIn("view: env.services.view", self.main_app)

    def test_phase649_view_manager_open_from_act_window(self):
        self.assertIn("openFromActWindow(action, options)", self.view_manager)
        self.assertIn("env.services.action", self.view_manager)

    def test_phase648_navigate_act_window_choke_point(self):
        self.assertIn("function navigateActWindowIfAvailable", self.legacy_main)
        self.assertIn("navigateActWindowIfAvailable(nav && nav.action", self.legacy_shell_routes)
        self.assertIn("source: 'sidebar'", self.legacy_shell_routes)

    def test_phase649_action_service_open_from_act_window_bridge(self):
        self.assertIn("openFromActWindow(actionDef, options)", self.services)

    def test_phase658_dispatch_act_window_for_list_route(self):
        self.assertIn("function dispatchActWindowForListRoute", self.legacy_main)
        self.assertIn("source: 'routeApplyList'", self.legacy_main)

    def test_phase659_form_save_dispatches_list_action(self):
        self.assertIn("source: 'formSaveReturnList'", self.legacy_form_views)
        self.assertIn("dispatchActWindowForListRoute(route", self.legacy_form_views)

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
        self.assertIn("source: 'listViewSwitch'", self.legacy_list_views)
        self.assertIn("dispatchActWindowForListRoute(route, { source: 'listViewSwitch' })", self.legacy_list_views)

    def test_phase681_list_breadcrumb_append_from_chrome(self):
        self.assertIn("__ERP_PENDING_LIST_NAV_SOURCE", self.legacy_main)
        self.assertIn("applyActionStackForList", self.legacy_main)
        self.assertIn("window.__ERP_PENDING_LIST_NAV_SOURCE = opt.source", self.legacy_main)
        self.assertIn('__ERP_PENDING_LIST_NAV_SOURCE = "navigateFromMenu"', self.services)

    def test_phase691_view_service_registered(self):
        self.assertRegex(self.services, r'category\("services"\)\.add\("view"')
        self.assertIn("loadViews(", self.services)
        self.assertIn("createViewService", self.services)

    def test_phase693_view_manager_prefetches_load_views(self):
        self.assertIn("viewSvc.loadViews(resModel", self.view_manager)
        self.assertIn("__ERP_lastLoadViews", self.view_manager)

    def test_phase694_breadcrumb_stack_sync_hash(self):
        self.assertIn("function syncHashWithActionStackIfMulti", self.legacy_main)
        self.assertIn("syncHashWithActionStackIfMulti(route)", self.legacy_main)

    def test_phase668_form_object_action_act_window_uses_route(self):
        idx = self.legacy_form_views.find("if (actRoute && resId)")
        self.assertGreaterEqual(idx, 0)
        chunk = self.legacy_form_views[idx : idx + 220]
        self.assertIn("route();", chunk)
        self.assertNotIn("renderContent()", chunk)

    def test_phase695_load_views_fields_from_fields_meta(self):
        self.assertIn("Phase 695:", self.services)
        self.assertIn("getFieldsMeta(resModel)", self.services)

    def test_phase668_list_kanban_form_hash_dispatches_act_window(self):
        self.assertIn("function dispatchListActWindowThenFormHash", self.legacy_main)
        self.assertIn("listToolbarNew", self.list_view_module)
        self.assertIn("kanbanCardOpenForm", self.kanban_view_module)
        self.assertIn("listKeyboardEnterForm", self.list_view_module)

    def test_phase696_form_route_preserves_decoded_stack_leaf(self):
        self.assertIn("Phase 696:", self.legacy_form_views)
        self.assertIn("formLeaf", self.legacy_form_views)

    def test_phase728_list_table_edit_link_dispatches_act_window(self):
        self.assertIn("listTableEditLink", self.list_view_module)
        self.assertIn("setupListTableEditLinkClicks", self.list_view_module)
        self.assertIn("data-edit-id", self.list_view_module)

    def test_phase728_view_manager_load_views_debug_fields_meta(self):
        self.assertIn("fieldsKeyCount", self.view_manager)
        self.assertIn("fieldsSampleKeys", self.view_manager)
        self.assertIn("__ERP_DEBUG_LOAD_VIEWS", self.view_manager)

    def test_phase730_gantt_activity_calendar_actwindow_delegation(self):
        self.assertIn("function attachActWindowFormLinkDelegation", self.legacy_main)
        self.assertIn("ganttNameEditLink", self.legacy_chart_views)
        self.assertIn("activityMatrixEditLink", self.legacy_chart_views)
        self.assertIn("calendarEventEditLink", self.legacy_chart_views)
        self.assertIn("o-erp-actwindow-form-link", self.legacy_main)


if __name__ == "__main__":
    unittest.main()
