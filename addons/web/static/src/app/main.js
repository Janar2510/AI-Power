// ERP Frontend Runtime
import { createBootstrap, createEnv, registerTemplates, startServices } from "./env.js";
import { WebClient } from "./webclient.js";
import * as ListControlPanel from "./list_control_panel.js";
import * as FormFooterActions from "./form_footer_actions.js";
import { registerNavbarContract } from "./navbar_contract.js";
import * as MenuUtils from "./menu_utils.js";

function registerModernViewFacades() {
  window.AppCore = window.AppCore || {};
  window.AppCore.ListControlPanel = ListControlPanel;
  window.AppCore.FormFooterActions = FormFooterActions;
}

function bootModernWebClient() {
  if (window.__ERPModernWebClientLoaded) {
    return window.__ERPModernWebClientRuntime || null;
  }
  window.__ERPModernWebClientLoaded = true;

  registerNavbarContract();
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
  };
  window.__ERPModernWebClientRuntime = runtime;
  window.ERPFrontendRuntime = runtime;
  return runtime;
}

bootModernWebClient();
