import { createRegistry } from "./registry.js";
import { createModernServices } from "./services.js";

function createEventBus() {
  const listeners = new Map();
  return {
    on(name, handler) {
      if (!listeners.has(name)) {
        listeners.set(name, new Set());
      }
      listeners.get(name).add(handler);
      return function () {
        listeners.get(name).delete(handler);
      };
    },
    trigger(name, detail) {
      const bucket = listeners.get(name);
      if (!bucket) return;
      bucket.forEach(function (handler) {
        handler({ detail: detail });
      });
    },
  };
}

export function createBootstrap() {
  const bootstrap = window.__erpFrontendBootstrap || {};
  return {
    runtime: bootstrap.runtime || "modern",
    brandName: bootstrap.brandName || "Foundry One",
    version: bootstrap.version || "phase-2-shell-cutover",
    theme: bootstrap.theme || "light",
    debugAssets: !!bootstrap.debugAssets,
    session: bootstrap.session || null,
    menus: Array.isArray(bootstrap.menus) ? bootstrap.menus : [],
    shellOwner: bootstrap.shellOwner || "modern",
    endpoints: Object.assign({
      sessionInfo: "/web/session/get_session_info",
      views: "/web/load_views",
      menus: "/web/webclient/load_menus",
    }, bootstrap.endpoints || {}),
    legacyAdapterEnabled: bootstrap.legacyAdapterEnabled !== false,
  };
}

export function createEnv(bootstrap) {
  return {
    bootstrap: bootstrap,
    debug: bootstrap.debugAssets ? "assets" : "",
    bus: createEventBus(),
    registries: createRegistry(),
    services: {},
    templates: new Map(),
    state: {
      runtime: bootstrap.runtime,
      legacyBooted: false,
    },
  };
}

export function registerTemplates(env) {
  env.templates.set("web.WebClient", "<div class=\"o-webclient-modern-root\"></div>");
  env.templates.set("web.NavBar", "<header class=\"o-navbar-shell\"></header>");
  env.templates.set("web.Sidebar", "<aside class=\"o-sidebar-shell\"></aside>");
}

export function startServices(env) {
  env.services = createModernServices(env);
  window.ERPFrontendRegistries = env.registries;
  window.ERPFrontendServices = env.services;
  return env.services;
}
