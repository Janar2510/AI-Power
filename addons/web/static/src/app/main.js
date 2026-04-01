// ERP Frontend Runtime
import "../search/search_model.js";
import { createBootstrap, createEnv, registerTemplates, startServices } from "./env.js";
import { WebClient } from "./webclient.js";
import * as ListControlPanel from "./list_control_panel.js";
import * as ListViewModule from "./list_view_module.js";
import "./form_view_module.js";
import "./kanban_view_module.js";
import "./gantt_view_module.js";
import "./graph_view_module.js";
import "./pivot_view_module.js";
import "./calendar_view_module.js";
import "./activity_view_module.js";
import "./discuss_view_module.js";
import "./settings_view_module.js";
import "./import_view_module.js";
import "./report_view_module.js";
import * as FormFooterActions from "./form_footer_actions.js";
import { registerNavbarContract } from "./navbar_contract.js";
import { registerNavbarFacade } from "./navbar_facade.js";
import { registerHomeModule } from "./home_module.js";
import * as BreadcrumbStrip from "./breadcrumb_strip.js";
import * as KanbanControlStrip from "./kanban_control_strip.js";
import * as MenuUtils from "./menu_utils.js";
import * as ChatterStrip from "./chatter_strip.js";
import * as KanbanCardChrome from "./kanban_card_chrome.js";
import "./graph_view_chrome.js";
import "./pivot_view_chrome.js";
import "./calendar_view_chrome.js";

// Track I: OWL Component Library
import "./core/hooks.js";
import "./core/dialog.js";
import "./core/dropdown.js";
import "./core/notebook.js";
import "./core/pager.js";
import "./core/autocomplete.js";
import "./core/colorlist.js";

// Track J: View MVC + view registry
import "./views/view_registry.js";
import "./views/list/list_controller.js";
import "./views/form/form_controller.js";
import "./views/kanban/kanban_controller.js";
import "./views/graph/graph_controller.js";
import "./views/pivot/pivot_controller.js";
import "./views/calendar/calendar_controller.js";

// Track K: Action Container + Client Actions
import { ActionBus, ActionContainer } from "./action_container.js";
import { registerBuiltinClientActions, BUILTIN_CLIENT_ACTIONS } from "./client_actions.js";

// Track M: Field Widgets
import "./views/fields/field.js";
import "./views/fields/core_fields.js";
import "./views/fields/relational_fields.js";

// Track N: Search + Control Panel
import { SearchBar } from "./search/search_bar.js";
import { SearchPanel } from "./search/search_panel.js";
import { ControlPanel } from "./search/control_panel.js";

// Track O1: WithSearch HOC
import { WithSearch, createSearchModel } from "./search/with_search.js";

// Track O4: View service
import { createViewService } from "./services/view_service.js";
import { erpDebugBootLog } from "./debug_boot.js";

function registerModernViewFacades() {
  window.AppCore = window.AppCore || {};
  // Navbar HTML builder: core/navbar_chrome.js → AppCore.NavbarChrome. Home KPI: core/dashboard_kpi_strip.js + wireHomeKpiStrip from legacy main.js.
  window.AppCore.ListControlPanel = ListControlPanel;
  window.AppCore.ListViewModule = ListViewModule;
  window.AppCore.FormFooterActions = FormFooterActions;
  window.AppCore.BreadcrumbStrip = BreadcrumbStrip;
  window.AppCore.KanbanControlStrip = KanbanControlStrip;
  window.AppCore.ChatterStrip = ChatterStrip;
  window.AppCore.KanbanCardChrome = KanbanCardChrome;
  // Track K: ActionBus + ActionContainer
  window.AppCore.ActionBus = ActionBus;
  window.AppCore.ActionContainer = ActionContainer;
  // Track N: Search + Control Panel
  window.AppCore.SearchBarOWL = SearchBar;
  window.AppCore.SearchPanel = SearchPanel;
  window.AppCore.ControlPanel = ControlPanel;
  // Track O1: WithSearch HOC
  window.AppCore.WithSearch = WithSearch;
  window.AppCore.createSearchModel = createSearchModel;
  // Track O4: View service
  window.AppCore.ViewService = createViewService();
}

function bootModernWebClient() {
  if (window.__ERPModernWebClientLoaded) {
    return window.__ERPModernWebClientRuntime || null;
  }

  try {
    registerNavbarContract();
    registerNavbarFacade();
    registerHomeModule();
    registerModernViewFacades();

    const bootstrap = createBootstrap();
    const env = createEnv(bootstrap);
    startServices(env);
    registerTemplates(env);
    // Post-1.248 P3: Mod+K / Ctrl+K command palette (legacy concat also calls initHotkey in main.js)
    const cp = env.services.commandPalette;
    if (cp && typeof cp.initHotkey === "function") {
      cp.initHotkey();
    }
    /** Post-1.249 Phase E: Alt+H → Home (shell navigation; avoids browser chrome conflicts). */
    const hk = window.Services && window.Services.hotkey;
    if (hk && typeof hk.register === "function") {
      hk.register("alt+h", function (evt) {
        if (!evt || evt.defaultPrevented) return;
        var t = evt.target;
        if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
        evt.preventDefault();
        window.location.hash = "#home";
      });
    }
    window.ERPFrontendRuntime = window.ERPFrontendRuntime || {};
    window.ERPFrontendRuntime.menuUtils = MenuUtils;
    // Prefer dedicated /web/webclient/load_menus; falls back to load_views menus on non-OK response.
    if (env.services.menu && typeof env.services.menu.load === "function") {
      env.services.menu.load(false).catch(function () {});
    }

    // Track K3: Register built-in client actions with both registries
    registerBuiltinClientActions(env);

    const app = new WebClient(env, document.getElementById("webclient"));
    app.mount();

    const runtime = {
      env: env,
      app: app,
      version: bootstrap.version,
      boot: bootModernWebClient,
      menuUtils: MenuUtils,
      /** Phase 636: modular action entry (doAction, navigateFromMenu, doActionButton). */
      action: env.services.action,
      /** Phase 691: Odoo-shaped view service (loadViews, getView). */
      view: env.services.view,
      /** Track K2+K3: ActionBus + BUILTIN_CLIENT_ACTIONS */
      ActionBus: ActionBus,
      clientActions: BUILTIN_CLIENT_ACTIONS,
    };
    window.__ERPModernWebClientRuntime = runtime;
    window.ERPFrontendRuntime = runtime;
    /** Set only after sync boot succeeds so the inline fallback can start legacy if this script throws. */
    window.__ERPModernWebClientLoaded = true;
    return runtime;
  } catch (err) {
    if (typeof console !== "undefined" && console.error) {
      console.error("[modern-webclient] boot failed", err);
    }
    erpDebugBootLog("modern_boot_exception", {
      message: err && err.message,
      stack: err && err.stack,
    });
    return null;
  }
}

bootModernWebClient();
