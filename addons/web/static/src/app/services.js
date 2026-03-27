import {
  actionToRoute,
  buildMenuTree,
  getAppIdForRoute,
  getAppRoots,
  getCurrentRoute,
  getDefaultRouteForAppNode,
  menuToRoute,
} from "./menu_utils.js";

function createFallbackSession(bootstrap) {
  let cached = bootstrap.session || null;
  return {
    getSessionInfo(force) {
      if (!force && cached) return Promise.resolve(cached);
      return fetch(bootstrap.endpoints.sessionInfo, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: "{}",
      }).then(function (response) {
        if (response.status === 401) return null;
        return response.json();
      }).then(function (data) {
        cached = data;
        return data;
      });
    },
    clearCache() {
      cached = null;
    },
  };
}

function createFallbackViews(bootstrap) {
  let cache = null;
  return {
    load(force) {
      if (!force && cache) return Promise.resolve(cache);
      return fetch(bootstrap.endpoints.views, {
        method: "GET",
        credentials: "include",
      }).then(function (response) {
        if (!response.ok) return { views: {}, actions: {}, menus: [] };
        return response.json();
      }).then(function (data) {
        cache = data || { views: {}, actions: {}, menus: [] };
        return cache;
      });
    },
    getMenus() {
      return (cache && cache.menus) || [];
    },
    getAction(id) {
      return cache && cache.actions ? cache.actions[id] : null;
    },
    getView(model, type) {
      const list = cache && cache.views ? (cache.views[model] || []) : [];
      return list.find(function (view) { return view.type === type; }) || null;
    },
    getFieldsMeta(model) {
      return (cache && cache.fields_meta && cache.fields_meta[model]) || null;
    },
  };
}

/**
 * Phase 691: Odoo-shaped `view` service — delegates to legacy/cache `views`; adds `loadViews` for act_window flows.
 */
function createViewService(viewsService) {
  return {
    load(force) {
      return viewsService.load(force);
    },
    getMenus() {
      return viewsService.getMenus();
    },
    getAction(id) {
      return viewsService.getAction(id);
    },
    getView(model, type) {
      return viewsService.getView(model, type);
    },
    loadViews(resModel, requested) {
      return viewsService.load().then(function () {
        const modes =
          Array.isArray(requested) && requested.length
            ? requested.map(function (p) {
                return Array.isArray(p) ? p[0] : p;
              })
            : ["list", "form"];
        const seen = {};
        const views = [];
        modes.forEach(function (mode) {
          const m = String(mode || "list");
          if (seen[m]) {
            return;
          }
          seen[m] = true;
          const v = viewsService.getView(resModel, m);
          if (v) {
            views.push([m, v]);
          }
        });
        /** Phase 695: fields from existing /web/load_views `fields_meta` only — no new RPC. */
        const fieldsPayload =
          typeof viewsService.getFieldsMeta === "function"
            ? viewsService.getFieldsMeta(resModel)
            : null;
        return { views: views, fields: fieldsPayload || {} };
      });
    },
  };
}

function createMenuService(bootstrap, viewsService) {
  let cachedMenus =
    bootstrap.menus && Array.isArray(bootstrap.menus) && bootstrap.menus.length > 0
      ? bootstrap.menus
      : null;
  let listeners = new Set();

  function notify() {
    listeners.forEach(function (listener) {
      listener(cachedMenus || []);
    });
  }

  return {
    load(force) {
      if (!force && cachedMenus) {
        return Promise.resolve(cachedMenus);
      }
      return fetch(bootstrap.endpoints.menus, {
        method: "GET",
        credentials: "include",
      }).then(function (response) {
        if (!response.ok) {
          return viewsService.load().then(function (payload) {
            cachedMenus = payload && payload.menus ? payload.menus : [];
            notify();
            return cachedMenus;
          });
        }
        return response.json().then(function (menus) {
          cachedMenus = Array.isArray(menus) ? menus : [];
          notify();
          return cachedMenus;
        });
      });
    },
    getAll() {
      return cachedMenus || [];
    },
    getTree() {
      return buildMenuTree(cachedMenus || []);
    },
    getApps() {
      return getAppRoots(this.getTree(), cachedMenus || []);
    },
    getCurrentAppId(route) {
      const nextRoute = route || getCurrentRoute();
      const autoAppId = getAppIdForRoute(nextRoute, cachedMenus || [], viewsService);
      const storedAppId = typeof localStorage !== "undefined" ? (localStorage.getItem("erp_sidebar_app") || "") : "";
      const apps = this.getApps();
      return autoAppId || storedAppId || (apps[0] && apps[0].menu && apps[0].menu.id) || "";
    },
    getCurrentApp(route) {
      const appId = String(this.getCurrentAppId(route) || "");
      return this.getApps().find(function (node) {
        return String((node.menu && node.menu.id) || "") === appId;
      }) || null;
    },
    getCurrentSidebarTree(route) {
      const currentApp = this.getCurrentApp(route);
      if (!currentApp) {
        return this.getTree();
      }
      return currentApp.children && currentApp.children.length ? currentApp.children : [currentApp];
    },
    getCurrentAppName(route) {
      const currentApp = this.getCurrentApp(route);
      return currentApp && currentApp.menu ? currentApp.menu.name || "" : "";
    },
    selectApp(appId) {
      const apps = this.getApps();
      const selected = apps.find(function (node) {
        return String((node.menu && node.menu.id) || "") === String(appId || "");
      });
      if (!selected) return null;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("erp_sidebar_app", String(appId));
      }
      return getDefaultRouteForAppNode(selected, viewsService) || "home";
    },
    subscribe(listener) {
      if (typeof listener !== "function") {
        return function () {};
      }
      listeners.add(listener);
      return function () {
        listeners.delete(listener);
      };
    },
  };
}

function createThemeService(bootstrap) {
  let listeners = new Set();

  function notify(theme) {
    listeners.forEach(function (listener) {
      listener(theme);
    });
  }

  return {
    getTheme() {
      if (typeof localStorage !== "undefined") {
        const saved = localStorage.getItem("erp_theme");
        if (saved) return saved;
      }
      return bootstrap.theme || "light";
    },
    apply(theme) {
      const next = theme || this.getTheme();
      document.documentElement.setAttribute("data-theme", next);
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("erp_theme", next);
      }
      notify(next);
      return next;
    },
    toggle() {
      const current = this.getTheme();
      return this.apply(current === "dark" ? "light" : "dark");
    },
    subscribe(listener) {
      if (typeof listener !== "function") {
        return function () {};
      }
      listeners.add(listener);
      return function () {
        listeners.delete(listener);
      };
    },
  };
}

function createTitleService(bootstrap) {
  return {
    setParts(parts) {
      const clean = (Array.isArray(parts) ? parts : [parts]).filter(Boolean);
      document.title = clean.length ? clean.join(" · ") : (bootstrap.brandName || "ERP Platform");
    },
  };
}

function createNotificationService() {
  return {
    getUnread() {
      return fetch("/mail/notifications", { credentials: "include" })
        .then(function (response) { return response.json(); })
        .catch(function () { return []; });
    },
    markAllRead() {
      const headers = { "Content-Type": "application/json" };
      if (window.Services && window.Services.session && window.Services.session.getAuthHeaders) {
        Object.assign(headers, window.Services.session.getAuthHeaders());
      }
      return fetch("/mail/notifications/mark_read", {
        method: "POST",
        credentials: "include",
        headers: headers,
        body: JSON.stringify({ all: true }),
      });
    },
  };
}

function createRouterService() {
  let currentRoute = getCurrentRoute();
  let started = false;
  const listeners = new Set();

  function notify() {
    currentRoute = getCurrentRoute();
    listeners.forEach(function (listener) {
      listener(currentRoute);
    });
  }

  function onHashChange() {
    notify();
  }

  return {
    start() {
      if (started) return;
      started = true;
      window.addEventListener("hashchange", onHashChange);
      notify();
    },
    stop() {
      if (!started) return;
      started = false;
      window.removeEventListener("hashchange", onHashChange);
    },
    getCurrentRoute() {
      return currentRoute;
    },
    navigate(route) {
      const next = String(route || "home").replace(/^#/, "");
      if ((window.location.hash || "#home") === "#" + next) {
        notify();
        return next;
      }
      window.location.hash = "#" + next;
      return next;
    },
    subscribe(listener) {
      if (typeof listener !== "function") {
        return function () {};
      }
      listeners.add(listener);
      return function () {
        listeners.delete(listener);
      };
    },
  };
}

function createActionService(viewsService, menuService, routerService) {
  const legacyAction = window.Services && window.Services.action ? window.Services.action : null;

  function navigateForActWindow(actionDef) {
    const route = actionToRoute(actionDef || {});
    if (route) {
      routerService.navigate(route);
      return route;
    }
    return null;
  }

  return {
    /**
     * Odoo-style action dispatch: legacy classifier + hash navigation for act_window.
     * Phase 636: when legacy returns { type: 'window', action }, apply actionToRoute so the shell updates.
     */
    doAction(actionDef, options) {
      const opt = options || {};
      if (opt.fromMenu && typeof window !== "undefined") {
        window.__ERP_PENDING_LIST_NAV_SOURCE = "navigateFromMenu";
      }
      const rawType = (actionDef && actionDef.type) || "";
      const isWindowType = rawType === "ir.actions.act_window" || rawType === "window";
      if (legacyAction && typeof legacyAction.doAction === "function") {
        return Promise.resolve(legacyAction.doAction(actionDef, opt)).then(function (result) {
          const windowPayload = result && result.type === "window" ? result : null;
          if (isWindowType || windowPayload) {
            const act = (windowPayload && windowPayload.action) || actionDef;
            navigateForActWindow(act);
          }
          return result;
        });
      }
      const route = actionToRoute(actionDef || {});
      if (route) {
        routerService.navigate(route);
      }
      return Promise.resolve(route);
    },
    /**
     * Phase 649 bridge: open list/form route from act_window; delegates to AppCore.ViewManager when present.
     */
    openFromActWindow(actionDef, options) {
      const VM = window.AppCore && window.AppCore.ViewManager;
      if (VM && typeof VM.openFromActWindow === "function") {
        return VM.openFromActWindow(actionDef, options || {});
      }
      return this.doAction(actionDef, options || {});
    },
    /**
     * Phase 637: single entry for sidebar / app picker — act_window from menu metadata or menuToRoute fallback.
     */
    navigateFromMenu(menu) {
      if (!menu || typeof menu !== "object") {
        return Promise.resolve(null);
      }
      const actionRef = menu.action;
      const action = actionRef ? viewsService.getAction(actionRef) : null;
      if (action) {
        return this.doAction(action, { fromMenu: true, menu: menu });
      }
      const fallbackRoute = menuToRoute(menu);
      if (fallbackRoute) {
        routerService.navigate(fallbackRoute);
        return Promise.resolve(fallbackRoute);
      }
      return Promise.resolve(null);
    },
    /** Phase 636: delegate form/list object buttons to legacy ActionManager. */
    doActionButton(opts) {
      if (window.ActionManager && typeof window.ActionManager.doActionButton === "function") {
        return window.ActionManager.doActionButton(opts || {});
      }
      return Promise.reject(new Error("ActionManager.doActionButton not available"));
    },
    getActionForRoute(route) {
      const menus = menuService.getAll();
      for (let index = 0; index < menus.length; index += 1) {
        const menu = menus[index];
        const action = menu && menu.action ? viewsService.getAction(menu.action) : null;
        if (action && actionToRoute(action) === route) {
          return action;
        }
      }
      return null;
    },
    loadState() {
      return Promise.resolve(false);
    },
  };
}

function createShellService(env, services) {
  const listeners = new Set();
  const state = {
    brandName: env.bootstrap.brandName || "Foundry One",
    route: getCurrentRoute(),
    userCompanies: null,
    userLangs: [],
    currentLang: "en_US",
    currentAppName: "",
    currentAppId: "",
    sidebarTree: [],
    staleBannerHtml: "",
    theme: services.theme.getTheme(),
  };

  function notify() {
    listeners.forEach(function (listener) {
      listener(state);
    });
    window.dispatchEvent(new CustomEvent("erp:shell-refresh", { detail: state }));
  }

  function refresh() {
    const route = services.router.getCurrentRoute();
    const menus = services.menu.getAll();
    const currentApp = services.menu.getCurrentApp(route);
    state.route = route;
    state.currentAppId = services.menu.getCurrentAppId(route);
    state.currentAppName = services.menu.getCurrentAppName(route);
    state.sidebarTree = services.menu.getCurrentSidebarTree(route);
    state.staleBannerHtml = menus.length ? "" : "Navigation menus missing. Run a module upgrade to rebuild the menu tree.";
    state.theme = services.theme.getTheme();
    if (state.userLangs.length) {
      services.title.setParts([state.brandName, state.currentAppName || route || "Home"]);
    }
    notify();
  }

  function getShellRoot() {
    return document.getElementById("webclient");
  }

  function applyStoredSidebarState() {
    const shell = getShellRoot();
    if (!shell) return;
    const collapsed = typeof localStorage !== "undefined" && localStorage.getItem("erp_sidebar_collapsed") === "1";
    shell.classList.toggle("o-app-shell--sidebar-collapsed", collapsed);
  }

  function closeMobileSidebar() {
    const shell = getShellRoot();
    if (!shell) return;
    shell.classList.remove("o-app-shell--sidebar-mobile-open");
    const backdrop = document.getElementById("o-sidebar-backdrop");
    if (backdrop) {
      backdrop.hidden = true;
      backdrop.setAttribute("aria-hidden", "true");
    }
  }

  function setMobileSidebar(open) {
    const shell = getShellRoot();
    if (!shell) return;
    shell.classList.toggle("o-app-shell--sidebar-mobile-open", !!open);
    const backdrop = document.getElementById("o-sidebar-backdrop");
    if (backdrop) {
      backdrop.hidden = !open;
      backdrop.setAttribute("aria-hidden", open ? "false" : "true");
    }
  }

  function toggleSidebarCollapse() {
    const shell = getShellRoot();
    if (!shell) return false;
    const collapsed = !shell.classList.contains("o-app-shell--sidebar-collapsed");
    shell.classList.toggle("o-app-shell--sidebar-collapsed", collapsed);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("erp_sidebar_collapsed", collapsed ? "1" : "0");
    }
    return collapsed;
  }

  function toggleMobileSidebar() {
    const shell = getShellRoot();
    if (!shell) return false;
    const open = !shell.classList.contains("o-app-shell--sidebar-mobile-open");
    setMobileSidebar(open);
    return open;
  }

  function applyNavContext(detail) {
    if (!detail || typeof detail !== "object") return;
    if (Object.prototype.hasOwnProperty.call(detail, "userCompanies")) {
      state.userCompanies = detail.userCompanies || null;
    }
    if (Object.prototype.hasOwnProperty.call(detail, "userLangs")) {
      state.userLangs = Array.isArray(detail.userLangs) ? detail.userLangs : [];
    }
    if (Object.prototype.hasOwnProperty.call(detail, "currentLang")) {
      state.currentLang = detail.currentLang || "en_US";
    }
    refresh();
  }

  return {
    state: state,
    load() {
      return Promise.all([
        services.session.getSessionInfo().catch(function () { return null; }),
        services.views.load().catch(function () { return { menus: [] }; }),
        services.menu.load().catch(function () { return []; }),
      ]).then(function (results) {
        const sessionInfo = results[0] || {};
        state.userCompanies = sessionInfo.user_companies || state.userCompanies;
        state.userLangs = sessionInfo.user_langs || state.userLangs;
        state.currentLang = sessionInfo.lang || state.currentLang;
        applyStoredSidebarState();
        refresh();
        return state;
      });
    },
    refresh: refresh,
    subscribe(listener) {
      if (typeof listener !== "function") {
        return function () {};
      }
      listeners.add(listener);
      return function () {
        listeners.delete(listener);
      };
    },
    applyStoredSidebarState: applyStoredSidebarState,
    closeMobileSidebar: closeMobileSidebar,
    setMobileSidebar: setMobileSidebar,
    toggleMobileSidebar: toggleMobileSidebar,
    toggleSidebarCollapse: toggleSidebarCollapse,
    applyNavContext: applyNavContext,
  };
}

export function createModernServices(env) {
  const bootstrap = env.bootstrap;
  const legacy = window.Services || {};
  const views = legacy.views || createFallbackViews(bootstrap);
  const view = createViewService(views);
  const router = createRouterService();
  const services = {
    session: legacy.session || createFallbackSession(bootstrap),
    rpc: legacy.rpc || null,
    i18n: legacy.i18n || null,
    hotkey: legacy.hotkey || null,
    commandPalette: legacy.commandPalette || null,
    views: views,
    view: view,
    menu: createMenuService(bootstrap, views),
    title: createTitleService(bootstrap),
    theme: createThemeService(bootstrap),
    notification: createNotificationService(),
    router: router,
  };
  services.action = createActionService(views, services.menu, router);
  services.shell = createShellService(env, services);
  services.router.subscribe(function () {
    services.shell.refresh();
  });
  services.menu.subscribe(function () {
    services.shell.refresh();
  });
  services.theme.subscribe(function () {
    services.shell.refresh();
  });

  if (!env.registries.category("services").has("session")) {
    env.registries.category("services").add("session", services.session, { sequence: 10 });
    env.registries.category("services").add("rpc", services.rpc, { sequence: 20 });
    env.registries.category("services").add("views", services.views, { sequence: 30 });
    env.registries.category("services").add("view", services.view, { sequence: 31 });
    env.registries.category("services").add("menu", services.menu, { sequence: 40 });
    env.registries.category("services").add("router", services.router, { sequence: 50 });
    env.registries.category("services").add("action", services.action, { sequence: 60 });
    env.registries.category("services").add("title", services.title, { sequence: 70 });
    env.registries.category("services").add("notification", services.notification, { sequence: 80 });
    env.registries.category("services").add("theme", services.theme, { sequence: 90 });
    env.registries.category("services").add("i18n", services.i18n, { sequence: 100 });
    env.registries.category("services").add("commandPalette", services.commandPalette, { sequence: 110 });
    env.registries.category("services").add("shell", services.shell, { sequence: 120 });
  }

  return services;
}
