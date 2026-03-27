// ERP Frontend Runtime
import { createBootstrap, createEnv, registerTemplates, startServices } from "./env.js";
import { WebClient } from "./webclient.js";
import * as ListControlPanel from "./list_control_panel.js";
import * as FormFooterActions from "./form_footer_actions.js";
import { registerNavbarContract } from "./navbar_contract.js";
import { registerNavbarFacade } from "./navbar_facade.js";
import * as BreadcrumbStrip from "./breadcrumb_strip.js";
import * as KanbanControlStrip from "./kanban_control_strip.js";
import * as MenuUtils from "./menu_utils.js";
import * as ChatterStrip from "./chatter_strip.js";
import * as KanbanCardChrome from "./kanban_card_chrome.js";
import "./graph_view_chrome.js";
import "./pivot_view_chrome.js";
import "./calendar_view_chrome.js";

function registerModernViewFacades() {
  window.AppCore = window.AppCore || {};
  // Navbar HTML builder: core/navbar_chrome.js → AppCore.NavbarChrome. Home KPI: core/dashboard_kpi_strip.js + wireHomeKpiStrip from legacy main.js.
  window.AppCore.ListControlPanel = ListControlPanel;
  window.AppCore.FormFooterActions = FormFooterActions;
  window.AppCore.BreadcrumbStrip = BreadcrumbStrip;
  window.AppCore.KanbanControlStrip = KanbanControlStrip;
  window.AppCore.ChatterStrip = ChatterStrip;
  window.AppCore.KanbanCardChrome = KanbanCardChrome;
}

function bootModernWebClient() {
  if (window.__ERPModernWebClientLoaded) {
    return window.__ERPModernWebClientRuntime || null;
  }
  window.__ERPModernWebClientLoaded = true;

  registerNavbarContract();
  registerNavbarFacade();
  registerModernViewFacades();

  const bootstrap = createBootstrap();
  const env = createEnv(bootstrap);
  startServices(env);
  registerTemplates(env);
  window.ERPFrontendRuntime = window.ERPFrontendRuntime || {};
  window.ERPFrontendRuntime.menuUtils = MenuUtils;
  // Prefer dedicated /web/webclient/load_menus; falls back to load_views menus on non-OK response.
  if (env.services.menu && typeof env.services.menu.load === "function") {
    env.services.menu.load(false).catch(function () {});
  }

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
  };
  window.__ERPModernWebClientRuntime = runtime;
  window.ERPFrontendRuntime = runtime;
  return runtime;
}

bootModernWebClient();
