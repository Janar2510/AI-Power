(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // addons/web/static/src/app/registry.js
  function createCategory() {
    const entries = /* @__PURE__ */ new Map();
    const listeners = /* @__PURE__ */ new Set();
    function notify(detail) {
      listeners.forEach(function(listener) {
        listener(detail);
      });
    }
    function orderedEntries() {
      return Array.from(entries.entries()).sort(function(left, right) {
        const leftSeq = left[1].sequence || 100;
        const rightSeq = right[1].sequence || 100;
        if (leftSeq !== rightSeq) {
          return leftSeq - rightSeq;
        }
        return String(left[0]).localeCompare(String(right[0]));
      });
    }
    return {
      add(key, value, options) {
        const entry = {
          key,
          value,
          sequence: options && options.sequence != null ? Number(options.sequence) : 100,
          options: options || {}
        };
        entries.set(key, entry);
        notify({ operation: "add", key, value, options: entry.options });
        return value;
      },
      delete(key) {
        const existing = entries.get(key);
        const deleted = entries.delete(key);
        if (deleted) {
          notify({ operation: "delete", key, value: existing && existing.value, options: existing && existing.options });
        }
        return deleted;
      },
      get(key) {
        const entry = entries.get(key);
        return entry ? entry.value : void 0;
      },
      getAll() {
        return orderedEntries().map(function(item) {
          return item[1].value;
        });
      },
      getEntries() {
        return orderedEntries().map(function(item) {
          return [item[0], item[1].value];
        });
      },
      getDetailedEntries() {
        return orderedEntries().map(function(item) {
          return {
            key: item[0],
            value: item[1].value,
            sequence: item[1].sequence,
            options: item[1].options
          };
        });
      },
      has(key) {
        return entries.has(key);
      },
      subscribe(listener) {
        if (typeof listener !== "function") {
          return function() {
          };
        }
        listeners.add(listener);
        return function() {
          listeners.delete(listener);
        };
      }
    };
  }
  function createRegistry() {
    const categories = /* @__PURE__ */ new Map();
    function ensureCategory(name) {
      if (!categories.has(name)) {
        categories.set(name, createCategory());
      }
      return categories.get(name);
    }
    return {
      category(name) {
        return ensureCategory(name);
      },
      snapshot() {
        const result = {};
        categories.forEach(function(category, key) {
          result[key] = category.getEntries();
        });
        return result;
      }
    };
  }

  // addons/web/static/src/app/menu_utils.js
  var menu_utils_exports = {};
  __export(menu_utils_exports, {
    actionToRoute: () => actionToRoute,
    buildMenuTree: () => buildMenuTree,
    getAppIdForRoute: () => getAppIdForRoute,
    getAppRoots: () => getAppRoots,
    getCurrentRoute: () => getCurrentRoute,
    getDefaultRouteForAppNode: () => getDefaultRouteForAppNode,
    menuToRoute: () => menuToRoute
  });
  function getCurrentRoute() {
    const hash = String(window.location.hash || "#home").replace(/^#/, "");
    return hash.split("?")[0] || "home";
  }
  function actionToRoute(action) {
    if (!action) return null;
    if (action.type === "ir.actions.act_url") {
      const rawUrl = String(action.url || "").trim();
      if (!rawUrl) return null;
      const hashIndex = rawUrl.indexOf("#");
      if (hashIndex >= 0) {
        const fragment = rawUrl.slice(hashIndex + 1).split("?")[0].trim();
        return fragment || null;
      }
      if (/^[a-z0-9_\-/]+$/i.test(rawUrl)) {
        return rawUrl;
      }
      return null;
    }
    if (action.type !== "ir.actions.act_window") return null;
    const modelSlug = String(action.res_model || "").replace(/\./g, "_");
    const byModel = {
      res_partner: "contacts",
      crm_lead: (action.name || "").toLowerCase().indexOf("pipeline") >= 0 ? "pipeline" : (action.name || "").toLowerCase().indexOf("activit") >= 0 ? "crm/activities" : "leads",
      project_task: "tasks",
      knowledge_article: "articles",
      knowledge_category: "knowledge_categories",
      sale_order: "orders",
      sale_subscription: "subscriptions",
      product_product: "products",
      ir_attachment: "attachments",
      res_users: "settings/users",
      approval_rule: "settings/approval_rules",
      approval_request: "settings/approval_requests",
      hr_leave: "leaves",
      hr_leave_type: "leave_types",
      hr_leave_allocation: "allocations",
      ir_cron: "cron",
      ir_actions_server: "server_actions",
      ir_sequence: "sequences",
      mrp_production: "manufacturing",
      mrp_bom: "boms",
      mrp_workcenter: "workcenters",
      stock_picking: "transfers",
      stock_warehouse: "warehouses",
      stock_lot: "lots",
      purchase_order: "purchase_orders",
      account_move: "invoices",
      account_bank_statement: "bank_statements",
      account_reconcile_wizard: "account_reconcile_wizard",
      account_journal: "journals",
      account_account: "accounts",
      account_tax: "taxes",
      account_payment_term: "payment_terms",
      hr_employee: "employees",
      hr_department: "departments",
      hr_job: "jobs",
      hr_attendance: "attendances",
      hr_applicant: "applicants",
      hr_contract: "contracts",
      project_project: "projects",
      calendar_event: "meetings",
      helpdesk_ticket: "tickets",
      analytic_line: "timesheets",
      analytic_account: "analytic_accounts",
      analytic_plan: "analytic_plans",
      product_pricelist: "pricelists",
      stock_warehouse_orderpoint: "reordering_rules",
      hr_expense: "expenses",
      repair_order: "repair_orders",
      survey_survey: "surveys",
      lunch_order: "lunch_orders",
      im_livechat_channel: "livechat_channels",
      data_recycle_model: "recycle_models",
      hr_skill: "skills",
      slide_channel: "elearning",
      audit_log: "audit_log",
      mailing_list: "marketing/mailing_lists",
      mailing_mailing: "marketing/mailings",
      crm_stage: "crm_stages",
      crm_tag: "crm_tags",
      crm_lost_reason: "crm_lost_reasons"
    };
    return byModel[modelSlug] || modelSlug || null;
  }
  function menuToRoute(menu) {
    if (!menu) return null;
    const name = String(menu.name || "").toLowerCase();
    const known = {
      home: "home",
      settings: "settings",
      "api keys": "settings/apikeys",
      contacts: "contacts",
      crm: "pipeline",
      leads: "leads",
      "my pipeline": "pipeline",
      "my activities": "crm/activities",
      discuss: "discuss",
      orders: "orders",
      products: "products",
      tasks: "tasks",
      invoicing: "invoices",
      inventory: "transfers",
      sales: "orders",
      hr: "employees",
      employees: "employees",
      departments: "departments",
      "job positions": "jobs",
      jobs: "jobs",
      expenses: "expenses",
      "my expenses": "expenses",
      attendances: "attendances",
      attendance: "attendances",
      recruitment: "recruitment",
      applicants: "applicants",
      "time off": "time_off",
      repairs: "repair_orders",
      surveys: "surveys",
      lunch: "lunch_orders",
      "live chat": "livechat_channels",
      "to-do": "project_todos",
      "data recycle": "recycle_models",
      skills: "skills",
      elearning: "elearning",
      "analytic plans": "analytic_plans",
      subscriptions: "subscriptions",
      meetings: "meetings",
      "recruitment stages": "recruitment_stages",
      valuation: "reports/stock-valuation",
      valuations: "reports/stock-valuation",
      "stock valuation report": "reports/stock-valuation",
      website: "website",
      ecommerce: "ecommerce",
      reports: "reports/trial-balance",
      stages: "crm_stages",
      tags: "crm_tags",
      "lost reasons": "crm_lost_reasons"
    };
    if (known[name]) {
      return known[name];
    }
    const slug = name.trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    const sectionOnly = { configuration: true, reporting: true, operations: true, sales: true, technical: true };
    if (slug && !sectionOnly[slug]) {
      return slug;
    }
    return null;
  }
  function buildMenuTree(menus) {
    const byId = {};
    const roots = [];
    (menus || []).forEach(function(menu) {
      byId[menu.id || menu.name] = { menu, children: [] };
    });
    (menus || []).forEach(function(menu) {
      const node = byId[menu.id || menu.name];
      if (!node) return;
      const parentRef = menu.parent || "";
      if (!parentRef || !byId[parentRef]) {
        roots.push(node);
      } else {
        byId[parentRef].children.push(node);
      }
    });
    function sortRecursive(nodes) {
      nodes.sort(function(left, right) {
        return (left.menu.sequence || 0) - (right.menu.sequence || 0);
      });
      nodes.forEach(function(node) {
        if (node.children.length) {
          sortRecursive(node.children);
        }
      });
    }
    sortRecursive(roots);
    return roots;
  }
  function getAppRoots(tree, menus) {
    const byId = {};
    (menus || []).forEach(function(menu) {
      if (menu && menu.id) {
        byId[menu.id] = menu;
      }
    });
    return (tree || []).filter(function(node) {
      const menu = node.menu || {};
      if (!menu.id) return false;
      if (menu.app_id) {
        return menu.id === menu.app_id;
      }
      return !menu.parent || !byId[menu.parent];
    });
  }
  function getAppIdForRoute(route, menus, viewsService) {
    let match = null;
    (menus || []).some(function(menu) {
      const action = menu.action && viewsService ? viewsService.getAction(menu.action) : null;
      const resolvedRoute = action ? actionToRoute(action) : menuToRoute(menu);
      if (resolvedRoute && resolvedRoute === route) {
        match = menu.app_id || menu.id || null;
        return true;
      }
      return false;
    });
    return match;
  }
  function getDefaultRouteForAppNode(node, viewsService) {
    if (!node) return null;
    const queue = [node];
    while (queue.length) {
      const current = queue.shift();
      const menu = current && current.menu ? current.menu : null;
      if (menu) {
        const action = menu.action && viewsService ? viewsService.getAction(menu.action) : null;
        const route = action ? actionToRoute(action) : menuToRoute(menu);
        if (route) return route;
      }
      const children = current && current.children ? current.children : [];
      for (let index = 0; index < children.length; index += 1) {
        queue.push(children[index]);
      }
    }
    return null;
  }

  // addons/web/static/src/app/services.js
  function createFallbackSession(bootstrap) {
    let cached = bootstrap.session || null;
    return {
      getSessionInfo(force) {
        if (!force && cached) return Promise.resolve(cached);
        return fetch(bootstrap.endpoints.sessionInfo, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: "{}"
        }).then(function(response) {
          if (response.status === 401) return null;
          return response.json();
        }).then(function(data) {
          cached = data;
          return data;
        });
      },
      clearCache() {
        cached = null;
      }
    };
  }
  function createFallbackViews(bootstrap) {
    let cache = null;
    return {
      load(force) {
        if (!force && cache) return Promise.resolve(cache);
        return fetch(bootstrap.endpoints.views, {
          method: "GET",
          credentials: "include"
        }).then(function(response) {
          if (!response.ok) return { views: {}, actions: {}, menus: [] };
          return response.json();
        }).then(function(data) {
          cache = data || { views: {}, actions: {}, menus: [] };
          return cache;
        });
      },
      getMenus() {
        return cache && cache.menus || [];
      },
      getAction(id) {
        return cache && cache.actions ? cache.actions[id] : null;
      },
      getView(model, type) {
        const list = cache && cache.views ? cache.views[model] || [] : [];
        return list.find(function(view) {
          return view.type === type;
        }) || null;
      }
    };
  }
  function createMenuService(bootstrap, viewsService) {
    let cachedMenus = Array.isArray(bootstrap.menus) ? bootstrap.menus : null;
    let listeners = /* @__PURE__ */ new Set();
    function notify() {
      listeners.forEach(function(listener) {
        listener(cachedMenus || []);
      });
    }
    return {
      load(force) {
        if (!force && cachedMenus) return Promise.resolve(cachedMenus);
        return fetch(bootstrap.endpoints.menus, {
          method: "GET",
          credentials: "include"
        }).then(function(response) {
          if (!response.ok) {
            return viewsService.load().then(function(payload) {
              cachedMenus = payload && payload.menus ? payload.menus : [];
              notify();
              return cachedMenus;
            });
          }
          return response.json().then(function(menus) {
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
        const storedAppId = typeof localStorage !== "undefined" ? localStorage.getItem("erp_sidebar_app") || "" : "";
        const apps = this.getApps();
        return autoAppId || storedAppId || apps[0] && apps[0].menu && apps[0].menu.id || "";
      },
      getCurrentApp(route) {
        const appId = String(this.getCurrentAppId(route) || "");
        return this.getApps().find(function(node) {
          return String(node.menu && node.menu.id || "") === appId;
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
        const selected = apps.find(function(node) {
          return String(node.menu && node.menu.id || "") === String(appId || "");
        });
        if (!selected) return null;
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("erp_sidebar_app", String(appId));
        }
        return getDefaultRouteForAppNode(selected, viewsService) || "home";
      },
      subscribe(listener) {
        if (typeof listener !== "function") {
          return function() {
          };
        }
        listeners.add(listener);
        return function() {
          listeners.delete(listener);
        };
      }
    };
  }
  function createThemeService(bootstrap) {
    let listeners = /* @__PURE__ */ new Set();
    function notify(theme) {
      listeners.forEach(function(listener) {
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
          return function() {
          };
        }
        listeners.add(listener);
        return function() {
          listeners.delete(listener);
        };
      }
    };
  }
  function createTitleService(bootstrap) {
    return {
      setParts(parts) {
        const clean = (Array.isArray(parts) ? parts : [parts]).filter(Boolean);
        document.title = clean.length ? clean.join(" \xB7 ") : bootstrap.brandName || "ERP Platform";
      }
    };
  }
  function createNotificationService() {
    return {
      getUnread() {
        return fetch("/mail/notifications", { credentials: "include" }).then(function(response) {
          return response.json();
        }).catch(function() {
          return [];
        });
      },
      markAllRead() {
        const headers = { "Content-Type": "application/json" };
        if (window.Services && window.Services.session && window.Services.session.getAuthHeaders) {
          Object.assign(headers, window.Services.session.getAuthHeaders());
        }
        return fetch("/mail/notifications/mark_read", {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({ all: true })
        });
      }
    };
  }
  function createRouterService() {
    let currentRoute = getCurrentRoute();
    let started = false;
    const listeners = /* @__PURE__ */ new Set();
    function notify() {
      currentRoute = getCurrentRoute();
      listeners.forEach(function(listener) {
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
          return function() {
          };
        }
        listeners.add(listener);
        return function() {
          listeners.delete(listener);
        };
      }
    };
  }
  function createActionService(viewsService, menuService, routerService) {
    const legacyAction = window.Services && window.Services.action ? window.Services.action : null;
    return {
      doAction(actionDef, options) {
        if (legacyAction && typeof legacyAction.doAction === "function") {
          return Promise.resolve(legacyAction.doAction(actionDef, options));
        }
        const route = actionToRoute(actionDef || {});
        if (route) {
          routerService.navigate(route);
        }
        return Promise.resolve(route);
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
      }
    };
  }
  function createShellService(env, services) {
    const listeners = /* @__PURE__ */ new Set();
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
      theme: services.theme.getTheme()
    };
    function notify() {
      listeners.forEach(function(listener) {
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
      state,
      load() {
        return Promise.all([
          services.session.getSessionInfo().catch(function() {
            return null;
          }),
          services.views.load().catch(function() {
            return { menus: [] };
          }),
          services.menu.load().catch(function() {
            return [];
          })
        ]).then(function(results) {
          const sessionInfo = results[0] || {};
          state.userCompanies = sessionInfo.user_companies || state.userCompanies;
          state.userLangs = sessionInfo.user_langs || state.userLangs;
          state.currentLang = sessionInfo.lang || state.currentLang;
          applyStoredSidebarState();
          refresh();
          return state;
        });
      },
      refresh,
      subscribe(listener) {
        if (typeof listener !== "function") {
          return function() {
          };
        }
        listeners.add(listener);
        return function() {
          listeners.delete(listener);
        };
      },
      applyStoredSidebarState,
      closeMobileSidebar,
      setMobileSidebar,
      toggleMobileSidebar,
      toggleSidebarCollapse,
      applyNavContext
    };
  }
  function createModernServices(env) {
    const bootstrap = env.bootstrap;
    const legacy = window.Services || {};
    const views = legacy.views || createFallbackViews(bootstrap);
    const router = createRouterService();
    const services = {
      session: legacy.session || createFallbackSession(bootstrap),
      rpc: legacy.rpc || null,
      i18n: legacy.i18n || null,
      hotkey: legacy.hotkey || null,
      commandPalette: legacy.commandPalette || null,
      views,
      menu: createMenuService(bootstrap, views),
      title: createTitleService(bootstrap),
      theme: createThemeService(bootstrap),
      notification: createNotificationService(),
      router
    };
    services.action = createActionService(views, services.menu, router);
    services.shell = createShellService(env, services);
    services.router.subscribe(function() {
      services.shell.refresh();
    });
    services.menu.subscribe(function() {
      services.shell.refresh();
    });
    services.theme.subscribe(function() {
      services.shell.refresh();
    });
    if (!env.registries.category("services").has("session")) {
      env.registries.category("services").add("session", services.session, { sequence: 10 });
      env.registries.category("services").add("rpc", services.rpc, { sequence: 20 });
      env.registries.category("services").add("views", services.views, { sequence: 30 });
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

  // addons/web/static/src/app/env.js
  function createEventBus() {
    const listeners = /* @__PURE__ */ new Map();
    return {
      on(name, handler) {
        if (!listeners.has(name)) {
          listeners.set(name, /* @__PURE__ */ new Set());
        }
        listeners.get(name).add(handler);
        return function() {
          listeners.get(name).delete(handler);
        };
      },
      trigger(name, detail) {
        const bucket = listeners.get(name);
        if (!bucket) return;
        bucket.forEach(function(handler) {
          handler({ detail });
        });
      }
    };
  }
  function createBootstrap() {
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
        menus: "/web/webclient/load_menus"
      }, bootstrap.endpoints || {}),
      legacyAdapterEnabled: bootstrap.legacyAdapterEnabled !== false
    };
  }
  function createEnv(bootstrap) {
    return {
      bootstrap,
      debug: bootstrap.debugAssets ? "assets" : "",
      bus: createEventBus(),
      registries: createRegistry(),
      services: {},
      templates: /* @__PURE__ */ new Map(),
      state: {
        runtime: bootstrap.runtime,
        legacyBooted: false
      }
    };
  }
  function registerTemplates(env) {
    env.templates.set("web.WebClient", '<div class="o-webclient-modern-root"></div>');
    env.templates.set("web.NavBar", '<header class="o-navbar-shell"></header>');
    env.templates.set("web.Sidebar", '<aside class="o-sidebar-shell"></aside>');
  }
  function startServices(env) {
    env.services = createModernServices(env);
    window.ERPFrontendRegistries = env.registries;
    window.ERPFrontendServices = env.services;
    return env.services;
  }

  // addons/web/static/src/app/owl_bridge.js
  function getOwl() {
    if (!window.owl) {
      throw new Error("OWL runtime missing. Expected /web/static/lib/owl/owl.js before the modern webclient bundle.");
    }
    return window.owl;
  }
  function cspScriptEvalBlocked() {
    const b = typeof window !== "undefined" && window.__erpFrontendBootstrap;
    if (b && b.cspScriptEvalBlocked === false) {
      return false;
    }
    return true;
  }
  function fallbackMount(ComponentClass, target, config, error) {
    if (!ComponentClass || typeof ComponentClass.fallbackMount !== "function") {
      throw error;
    }
    if (typeof console !== "undefined" && console.warn) {
      console.warn(
        "[modern-webclient] Falling back to CSP-safe shell mount for",
        ComponentClass && ComponentClass.name ? ComponentClass.name : "anonymous-component",
        error
      );
    }
    if (target) {
      target.innerHTML = "";
    }
    return ComponentClass.fallbackMount(config && config.env || null, target, error);
  }
  function mountComponent(ComponentClass, target, config) {
    const cfg = config || {};
    if (ComponentClass && typeof ComponentClass.fallbackMount === "function" && cspScriptEvalBlocked()) {
      return Promise.resolve(ComponentClass.fallbackMount(cfg.env || null, target));
    }
    try {
      const owl3 = getOwl();
      return Promise.resolve(owl3.mount(ComponentClass, target, cfg)).catch(function(error) {
        return fallbackMount(ComponentClass, target, cfg, error);
      });
    } catch (error) {
      return Promise.resolve(fallbackMount(ComponentClass, target, cfg, error));
    }
  }

  // addons/web/static/src/app/navbar.js
  var owl = window.owl;
  var { Component, onMounted, onPatched, onWillUnmount, xml, useRef } = owl;
  function cleanupHost(host) {
    if (!host || !host.__modernNavbarCleanup) return;
    host.__modernNavbarCleanup.forEach(function(cleanup) {
      if (typeof cleanup === "function") cleanup();
    });
    host.__modernNavbarCleanup = [];
  }
  function renderNavbarIntoHost(env, host) {
    const shell = env.services.shell.state;
    if (!host || !window.AppCore || !window.AppCore.Navbar) return;
    cleanupHost(host);
    window.AppCore.Navbar.render({
      navbar: host,
      appSidebar: document.getElementById("app-sidebar"),
      brandName: shell.brandName,
      navItems: [],
      selectedAppName: shell.currentAppName,
      staleBannerHtml: shell.staleBannerHtml,
      userCompanies: shell.userCompanies,
      userLangs: shell.userLangs,
      currentLang: shell.currentLang,
      theme: shell.theme
    });
    if (window.__erpNavbarContract && typeof window.__erpNavbarContract.markDelegated === "function") {
      window.__erpNavbarContract.markDelegated(host);
    }
    const cleanups = [];
    const hamburger = host.querySelector(".nav-hamburger");
    if (hamburger && window.__erpModernShellController) {
      const onHamburgerClick = function() {
        window.__erpModernShellController.toggleMobileSidebar();
      };
      hamburger.addEventListener("click", onHamburgerClick);
      cleanups.push(function() {
        hamburger.removeEventListener("click", onHamburgerClick);
      });
    }
    const sidebarToggle = host.querySelector(".nav-sidebar-toggle");
    if (sidebarToggle && window.__erpModernShellController) {
      const onSidebarToggle = function() {
        const collapsed = window.__erpModernShellController.toggleSidebarCollapse();
        sidebarToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      };
      sidebarToggle.addEventListener("click", onSidebarToggle);
      cleanups.push(function() {
        sidebarToggle.removeEventListener("click", onSidebarToggle);
      });
    }
    host.__modernNavbarCleanup = cleanups;
  }
  var NavBar = class extends Component {
    static template = xml`<div t-ref="host" class="o-modern-navbar-slot"></div>`;
    setup() {
      this.hostRef = useRef("host");
      this.unsubscribe = this.env.services.shell.subscribe(this.renderShell.bind(this));
      onMounted(this.renderShell.bind(this));
      onPatched(this.renderShell.bind(this));
      onWillUnmount(() => {
        cleanupHost(this.hostRef.el);
        if (typeof this.unsubscribe === "function") {
          this.unsubscribe();
        }
      });
    }
    renderShell() {
      const host = this.hostRef.el;
      renderNavbarIntoHost(this.env, host);
    }
  };
  NavBar.fallbackMount = function fallbackMount2(env, target) {
    const render = function() {
      renderNavbarIntoHost(env, target);
    };
    render();
    const unsubscribe = env.services.shell.subscribe(render);
    return {
      destroy() {
        cleanupHost(target);
        if (typeof unsubscribe === "function") unsubscribe();
      },
      mode: "fallback"
    };
  };
  function mountNavBar(env, target) {
    if (!target) return null;
    return mountComponent(NavBar, target, { env });
  }

  // addons/web/static/src/app/sidebar.js
  var owl2 = window.owl;
  var { Component: Component2, onMounted: onMounted2, onPatched: onPatched2, onWillUnmount: onWillUnmount2, xml: xml2, useRef: useRef2 } = owl2;
  function escHtml(value) {
    return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function sidebarAbbrev(name) {
    const normalized = String(name || "").trim();
    if (!normalized) return "?";
    const parts = normalized.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return normalized.slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  function sidebarIconHtml(menu) {
    if (menu && menu.web_icon_data) {
      return '<img class="o-sidebar-icon" src="' + escHtml(menu.web_icon_data) + '" alt="" />';
    }
    if (menu && menu.web_icon) {
      const parts = String(menu.web_icon).split(",");
      if (parts[0]) {
        return '<i class="o-sidebar-icon ' + escHtml(parts[0].trim()) + '" aria-hidden="true"></i>';
      }
    }
    return '<span class="o-sidebar-abbrev">' + escHtml(sidebarAbbrev(menu && menu.name)) + "</span>";
  }
  function getFoldState() {
    try {
      return JSON.parse(localStorage.getItem("erp_sidebar_folds") || "{}");
    } catch (_error) {
      return {};
    }
  }
  function saveFoldState(next) {
    try {
      localStorage.setItem("erp_sidebar_folds", JSON.stringify(next || {}));
    } catch (_error) {
    }
  }
  function resolveRoute(menu, viewsService) {
    const action = menu && menu.action && viewsService ? viewsService.getAction(menu.action) : null;
    if (action && window.ERPFrontendRuntime && window.ERPFrontendRuntime.menuUtils) {
      return window.ERPFrontendRuntime.menuUtils.actionToRoute(action);
    }
    if (window.ERPFrontendRuntime && window.ERPFrontendRuntime.menuUtils) {
      return window.ERPFrontendRuntime.menuUtils.menuToRoute(menu);
    }
    return null;
  }
  function buildSidebarBranch(nodes, depth, activeRoute, viewsService) {
    let html = "";
    const folds = getFoldState();
    (nodes || []).forEach(function(node) {
      const menu = node.menu || {};
      const route = resolveRoute(menu, viewsService);
      const isActive = !!route && activeRoute === route;
      const hasChildren = !!(node.children && node.children.length);
      if (hasChildren) {
        const folded = !!folds["menu:" + String(menu.id || menu.name || "")];
        html += '<section class="o-sidebar-category' + (folded ? " o-sidebar-category--folded" : "") + '" data-menu-id="' + escHtml(menu.id || menu.name || "") + '">';
        html += '<button type="button" class="o-sidebar-category-head" aria-expanded="' + (folded ? "false" : "true") + '">';
        html += '<span class="o-sidebar-chevron" aria-hidden="true">&#9662;</span>';
        html += sidebarIconHtml(menu);
        html += '<span class="o-sidebar-category-name">' + escHtml(menu.name || "") + "</span>";
        html += "</button>";
        html += '<div class="o-sidebar-category-body">';
        html += buildSidebarBranch(node.children, depth + 1, activeRoute, viewsService);
        html += "</div></section>";
        return;
      }
      html += '<a class="o-sidebar-link' + (isActive ? " o-sidebar-link--active" : "") + (depth > 0 ? " o-sidebar-link--nested" : "") + (route ? "" : " o-sidebar-link-disabled") + '" href="' + (route ? "#" + route : "#") + '">';
      if (depth === 0) {
        html += sidebarIconHtml(menu);
      }
      html += '<span class="o-sidebar-link-text">' + escHtml(menu.name || "") + "</span>";
      html += "</a>";
    });
    return html;
  }
  function wireSidebar(host, onAfterWire) {
    const cleanups = [];
    const folds = getFoldState();
    host.querySelectorAll(".o-sidebar-category-head").forEach(function(button) {
      const onClick = function() {
        const section = button.closest(".o-sidebar-category");
        if (!section) return;
        section.classList.toggle("o-sidebar-category--folded");
        const folded = section.classList.contains("o-sidebar-category--folded");
        button.setAttribute("aria-expanded", folded ? "false" : "true");
        const menuId = section.getAttribute("data-menu-id");
        folds["menu:" + menuId] = folded;
        saveFoldState(folds);
      };
      button.addEventListener("click", onClick);
      cleanups.push(function() {
        button.removeEventListener("click", onClick);
      });
    });
    host.querySelectorAll("a.o-sidebar-link").forEach(function(link) {
      const onClick = function() {
        if (window.innerWidth <= 1023 && window.__erpModernShellController) {
          window.__erpModernShellController.closeMobileSidebar();
        }
      };
      link.addEventListener("click", onClick);
      cleanups.push(function() {
        link.removeEventListener("click", onClick);
      });
    });
    if (typeof onAfterWire === "function") {
      onAfterWire();
    }
    host.__modernSidebarCleanup = cleanups;
  }
  function cleanupHost2(host) {
    if (!host || !host.__modernSidebarCleanup) return;
    host.__modernSidebarCleanup.forEach(function(cleanup) {
      if (typeof cleanup === "function") cleanup();
    });
    host.__modernSidebarCleanup = [];
  }
  function renderSidebarIntoHost(env, host) {
    if (!host) return;
    const shell = env.services.shell.state;
    const tree = shell.sidebarTree || [];
    const route = shell.route || "home";
    cleanupHost2(host);
    host.innerHTML = '<div class="o-sidebar-inner"><div class="o-sidebar-scroll">' + (shell.staleBannerHtml ? '<div class="o-sidebar-stale">' + shell.staleBannerHtml + "</div>" : "") + '<nav class="o-sidebar-nav" role="navigation">' + (tree.length ? buildSidebarBranch(tree, 0, route, env.services.views) : '<p class="o-sidebar-empty">No menu items.</p>') + "</nav></div></div>";
    wireSidebar(host);
  }
  var Sidebar = class extends Component2 {
    static template = xml2`<div t-ref="host" class="o-modern-sidebar-slot"></div>`;
    setup() {
      this.hostRef = useRef2("host");
      this.unsubscribe = this.env.services.shell.subscribe(this.renderShell.bind(this));
      onMounted2(this.renderShell.bind(this));
      onPatched2(this.renderShell.bind(this));
      onWillUnmount2(() => {
        cleanupHost2(this.hostRef.el);
        if (typeof this.unsubscribe === "function") {
          this.unsubscribe();
        }
      });
    }
    renderShell() {
      const host = this.hostRef.el;
      renderSidebarIntoHost(this.env, host);
    }
  };
  Sidebar.fallbackMount = function fallbackMount3(env, target) {
    const render = function() {
      renderSidebarIntoHost(env, target);
    };
    render();
    const unsubscribe = env.services.shell.subscribe(render);
    return {
      destroy() {
        cleanupHost2(target);
        if (typeof unsubscribe === "function") unsubscribe();
      },
      mode: "fallback"
    };
  };
  function mountSidebar(env, target) {
    if (!target) return null;
    return mountComponent(Sidebar, target, { env });
  }

  // addons/web/static/src/app/shell_chrome.js
  function attachShellChrome(env) {
    const root = document.documentElement;
    const shell = document.getElementById("webclient");
    if (root) {
      root.setAttribute("data-erp-shell-owner", "modern");
    }
    if (shell) {
      shell.setAttribute("data-erp-runtime", "modern");
      shell.setAttribute("data-erp-shell-owner", "modern");
    }
    document.body.setAttribute("data-erp-runtime", "modern");
    env.services.shell.applyStoredSidebarState();
    env.services.theme.apply(env.bootstrap.theme);
    function syncViewport() {
      if (window.innerWidth > 1023) {
        env.services.shell.closeMobileSidebar();
      }
    }
    window.addEventListener("resize", syncViewport);
    const controller = {
      env,
      phase: "phase-2-shell-cutover",
      toggleSidebarCollapse() {
        return env.services.shell.toggleSidebarCollapse();
      },
      toggleMobileSidebar() {
        return env.services.shell.toggleMobileSidebar();
      },
      closeMobileSidebar() {
        return env.services.shell.closeMobileSidebar();
      },
      applyNavContext(detail) {
        env.services.shell.applyNavContext(detail);
      },
      refresh() {
        env.services.shell.refresh();
      }
    };
    window.__erpModernShellController = controller;
    return controller;
  }

  // addons/web/static/src/app/webclient.js
  var WebClient = class {
    constructor(env, target) {
      this.env = env;
      this.target = target;
      this.navbarApp = null;
      this.sidebarApp = null;
    }
    mount() {
      if (!this.target) return;
      const navbar = document.getElementById("navbar");
      const sidebar = document.getElementById("app-sidebar");
      attachShellChrome(this.env);
      this.target.setAttribute("data-erp-runtime-version", this.env.bootstrap.version);
      this.target.classList.add("o-webclient-modern");
      this.env.services.router.start();
      this.env.services.shell.load().finally(() => {
        this.navbarApp = mountNavBar(this.env, navbar);
        this.sidebarApp = mountSidebar(this.env, sidebar);
        this._bootLegacyRuntime();
      });
    }
    _bootLegacyRuntime() {
      if (!this.env.bootstrap.legacyAdapterEnabled) return;
      if (!window.__erpLegacyRuntime || typeof window.__erpLegacyRuntime.start !== "function") return;
      if (window.__erpLegacyRuntime.booted) {
        this.env.state.legacyBooted = true;
        return;
      }
      window.__erpLegacyRuntime.start();
      this.env.state.legacyBooted = true;
    }
  };

  // addons/web/static/src/app/list_control_panel.js
  var list_control_panel_exports = {};
  __export(list_control_panel_exports, {
    buildListActionsHtml: () => buildListActionsHtml,
    buildQuickFiltersHtml: () => buildQuickFiltersHtml,
    buildSearchDropdownsHtml: () => buildSearchDropdownsHtml
  });
  function escHtml2(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function buildSearchDropdownsHtml(options) {
    var searchFilters = options.searchFilters || [];
    var activeFilters = options.activeFilters || [];
    var searchGroupBys = options.searchGroupBys || [];
    var currentGroupBy = options.currentGroupBy;
    var savedFiltersList = options.savedFiltersList || [];
    var dropdownsHtml = "";
    if (searchFilters.length) {
      dropdownsHtml += '<div class="o-cp-dropdown-wrap" data-cp-dd="1"><button type="button" class="o-cp-dropdown-toggle">Filters</button><div class="o-cp-dropdown-menu">';
      searchFilters.forEach(function(f) {
        var active = activeFilters.indexOf(f.name) >= 0;
        dropdownsHtml += '<button type="button" class="o-cp-dropdown-item cp-filter-item' + (active ? " active" : "") + '" data-filter-toggle="' + String(f.name || "").replace(/"/g, "&quot;") + '">' + escHtml2(f.string || f.name || "") + "</button>";
      });
      dropdownsHtml += "</div></div>";
    }
    if (searchGroupBys.length) {
      dropdownsHtml += '<div class="o-cp-dropdown-wrap" data-cp-dd="1"><button type="button" class="o-cp-dropdown-toggle">Group by</button><div class="o-cp-dropdown-menu">';
      dropdownsHtml += '<button type="button" class="o-cp-dropdown-item cp-groupby-item" data-group-by="">(None)</button>';
      searchGroupBys.forEach(function(g) {
        dropdownsHtml += '<button type="button" class="o-cp-dropdown-item cp-groupby-item' + (currentGroupBy === g.group_by ? " active" : "") + '" data-group-by="' + String(g.group_by || "").replace(/"/g, "&quot;") + '">' + escHtml2(g.string || g.name || "") + "</button>";
      });
      dropdownsHtml += "</div></div>";
    }
    dropdownsHtml += '<div class="o-cp-dropdown-wrap" data-cp-dd="1"><button type="button" class="o-cp-dropdown-toggle">Favorites</button><div class="o-cp-dropdown-menu">';
    savedFiltersList.forEach(function(sf) {
      dropdownsHtml += '<button type="button" class="o-cp-dropdown-item cp-fav-item" data-saved-filter-id="' + String(sf.id != null ? sf.id : "").replace(/"/g, "&quot;") + '">' + escHtml2(sf.name || "Filter") + "</button>";
    });
    dropdownsHtml += '<button type="button" class="o-cp-dropdown-item cp-save-fav" data-save-favorite="1">Save current search\u2026</button></div></div>';
    return dropdownsHtml;
  }
  function buildQuickFiltersHtml(options) {
    var searchFilters = options.searchFilters || [];
    var activeFilters = options.activeFilters || [];
    var searchGroupBys = options.searchGroupBys || [];
    var currentGroupBy = options.currentGroupBy;
    var savedFiltersList = options.savedFiltersList || [];
    var model = options.model || "";
    var currentListState = options.currentListState || {};
    var filtersHtml = "";
    searchFilters.forEach(function(f) {
      var active = activeFilters.indexOf(f.name) >= 0;
      filtersHtml += '<button type="button" class="btn-search-filter o-btn ' + (active ? "o-btn-primary active" : "o-btn-secondary") + '" data-filter="' + String(f.name || "").replace(/"/g, "&quot;") + '">' + escHtml2(f.string || f.name || "") + "</button>";
    });
    if (searchGroupBys.length) {
      filtersHtml += '<select id="list-group-by" class="o-list-select"><option value="">Group by</option>';
      searchGroupBys.forEach(function(g) {
        filtersHtml += '<option value="' + String(g.group_by || "").replace(/"/g, "&quot;") + '"' + (currentGroupBy === g.group_by ? " selected" : "") + ">" + escHtml2(g.string || g.name || "") + "</option>";
      });
      filtersHtml += "</select>";
    }
    filtersHtml += '<select id="list-saved-filter" class="o-list-select"><option value="">Saved filters</option>';
    savedFiltersList.forEach(function(f) {
      filtersHtml += '<option value="' + String(f.id != null ? f.id : "").replace(/"/g, "&quot;") + '"' + (currentListState.savedFilterId == f.id ? " selected" : "") + ">" + escHtml2(f.name || "Filter") + "</option>";
    });
    filtersHtml += "</select>";
    if (model === "crm.lead") {
      filtersHtml += '<select id="list-stage-filter" class="o-list-select"><option value="">All stages</option></select>';
    }
    return filtersHtml;
  }
  function buildListActionsHtml(options) {
    var addLabel = options.addLabel || "Add";
    var reportName = options.reportName;
    var actionsHtml = "";
    actionsHtml += '<button type="button" id="btn-save-filter" class="o-btn o-btn-secondary">Save</button>';
    actionsHtml += '<button type="button" id="btn-export" class="o-btn o-btn-secondary">Export CSV</button>';
    actionsHtml += '<button type="button" id="btn-export-excel" class="o-btn o-btn-secondary">Export Excel</button>';
    actionsHtml += '<button type="button" id="btn-import" class="o-btn o-btn-secondary">Import</button>';
    if (reportName) actionsHtml += '<button type="button" id="btn-print" class="o-btn o-btn-secondary">Print</button>';
    if (reportName) actionsHtml += '<button type="button" id="btn-preview-pdf" class="o-btn o-btn-secondary">Preview</button>';
    actionsHtml += '<button type="button" id="btn-add" class="o-btn o-btn-primary">' + escHtml2(addLabel) + "</button>";
    return actionsHtml;
  }

  // addons/web/static/src/app/form_footer_actions.js
  var form_footer_actions_exports = {};
  __export(form_footer_actions_exports, {
    buildFormFooterActionsHtml: () => buildFormFooterActionsHtml
  });
  function escHashRoute(route) {
    return String(route == null ? "" : route).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }
  function buildFormFooterActionsHtml(options) {
    var route = options.route || "";
    var isNew = !!options.isNew;
    var model = options.model || "";
    var reportName = options.reportName || null;
    var id = options.recordId;
    var html = '<p class="o-form-footer-actions">';
    html += '<button type="submit" id="btn-save" class="o-btn o-btn-primary o-shortcut-target" data-shortcut="Alt+S">Save</button> ';
    html += '<a href="#' + escHashRoute(route) + '" id="form-cancel" style="margin-left:0.5rem">Cancel</a>';
    if (isNew && (model === "crm.lead" || model === "res.partner")) {
      html += ' <button type="button" id="btn-ai-fill" title="Extract fields from pasted text" style="margin-left:0.5rem;padding:0.5rem 1rem;background:var(--color-accent,#6366f1);color:white;border:none;border-radius:4px;cursor:pointer">AI Fill</button>';
    }
    if (!isNew) {
      html += ' <button type="button" id="btn-duplicate" class="o-btn o-btn-secondary" style="margin-left:0.5rem">Duplicate</button>';
      if (reportName) {
        html += ' <a href="/report/html/' + encodeURIComponent(String(reportName)) + "/" + encodeURIComponent(String(id)) + '" target="_blank" rel="noopener" id="btn-print-form" class="o-btn o-btn-secondary o-shortcut-target" data-shortcut="Alt+P" style="margin-left:0.5rem;text-decoration:none">Print</a>';
        html += ' <button type="button" id="btn-preview-form" class="o-btn o-btn-secondary" style="margin-left:0.5rem">Preview</button>';
      }
      html += ' <a href="#" id="btn-delete-form" style="margin-left:0.5rem;font-size:0.9rem;color:#c00">Delete</a>';
    }
    html += "</p>";
    return html;
  }

  // addons/web/static/src/app/navbar_contract.js
  function registerNavbarContract() {
    window.__erpNavbarContract = {
      phase: "566",
      /** Legacy/AppCore.Navbar should call after writing chrome into the host slot. */
      markDelegated(host) {
        if (!host || !host.setAttribute) return;
        host.setAttribute("data-erp-navbar-contract", "566");
        host.setAttribute("data-erp-navbar-owner", "modern-delegated");
      }
    };
  }

  // addons/web/static/src/app/navbar_facade.js
  function registerNavbarFacade() {
    window.__erpNavbarFacade = {
      phase: "575",
      /** Call after systray HTML is injected into .o-systray-registry. */
      markSystrayRendered(host) {
        if (!host || !host.setAttribute) return;
        host.setAttribute("data-erp-systray-contract", "575");
      }
    };
  }

  // addons/web/static/src/app/breadcrumb_strip.js
  var breadcrumb_strip_exports = {};
  __export(breadcrumb_strip_exports, {
    buildBreadcrumbsHtml: () => buildBreadcrumbsHtml
  });
  function escLabel(s) {
    return String(s == null ? "" : s).replace(/</g, "&lt;");
  }
  function buildBreadcrumbsHtml(actionStack) {
    const stack = Array.isArray(actionStack) ? actionStack : [];
    if (window.UIComponents && window.UIComponents.Breadcrumbs && typeof window.UIComponents.Breadcrumbs.renderHTML === "function") {
      return window.UIComponents.Breadcrumbs.renderHTML(stack);
    }
    if (stack.length <= 1) return "";
    let html = '<nav class="breadcrumbs" aria-label="Breadcrumb">';
    stack.forEach(function(entry, i) {
      if (i === stack.length - 1) {
        html += '<span class="breadcrumb-item active">' + escLabel(entry.label) + "</span>";
      } else {
        html += '<a class="breadcrumb-item" href="javascript:void(0)" data-bc-idx="' + i + '">' + escLabel(entry.label) + "</a>";
        html += '<span class="breadcrumb-sep">/</span>';
      }
    });
    html += "</nav>";
    return html;
  }

  // addons/web/static/src/app/kanban_control_strip.js
  var kanban_control_strip_exports = {};
  __export(kanban_control_strip_exports, {
    buildKanbanChromeHtml: () => buildKanbanChromeHtml
  });
  function escAttr(v) {
    return String(v == null ? "" : v).replace(/"/g, "&quot;");
  }
  function escHtml3(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }
  function buildKanbanChromeHtml(opts) {
    const title = opts.title || "";
    const vs = opts.viewSwitcherHtml || "";
    const st = opts.searchTerm || "";
    const addLabel = opts.addLabel || "Add";
    const mid = opts.middleSlotHtml || "";
    let html = "<h2>" + escHtml3(title) + "</h2>";
    html += '<p class="o-kanban-control-strip" style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">';
    html += vs;
    html += '<input type="text" id="list-search" placeholder="Search..." style="padding:0.5rem;border:1px solid #ddd;border-radius:4px;min-width:200px" value="' + escAttr(st) + '">';
    html += '<button type="button" id="btn-search" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Search</button>';
    html += mid;
    html += '<button type="button" id="btn-add" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">' + escHtml3(addLabel) + "</button></p>";
    html += '<div id="kanban-area"></div>';
    return html;
  }

  // addons/web/static/src/app/chatter_strip.js
  var chatter_strip_exports = {};
  __export(chatter_strip_exports, {
    appendChatterRows: () => appendChatterRows,
    buildChatterChromeHtml: () => buildChatterChromeHtml,
    setChatterError: () => setChatterError
  });
  function escAttr2(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }
  function buildChatterChromeHtml(options) {
    var model = options && options.model || "";
    var label = options && options.label || "Messages";
    return "<p><label>" + escAttr2(label) + '</label><div id="chatter-messages" class="o-chatter o-chatter-chrome o-card-gradient" data-model="' + escAttr2(model) + '"><header class="o-chatter-chrome-head" aria-label="Discussion"><span class="o-chatter-chrome-title">Activity</span></header><div class="chatter-messages-list o-chatter-messages-scroll"></div><div class="chatter-compose o-chatter-compose"><textarea id="chatter-input" class="o-chatter-textarea" placeholder="Add a comment..." rows="3"></textarea><div class="o-chatter-compose-row"><input type="file" id="chatter-file" class="o-chatter-file" multiple /><span id="chatter-attachments" class="o-chatter-attachments-hint"></span></div><label class="o-chatter-send-email-label"><input type="checkbox" id="chatter-send-email" /> Send as email</label><button type="button" id="chatter-send" class="o-btn o-btn-primary o-chatter-send">Send</button></div></div></p>';
  }
  function escapeBodyText(body) {
    return String(body || "").replace(/</g, "&lt;").replace(/\n/g, "<br>");
  }
  function appendChatterRows(container, rows, nameMap) {
    if (!container) return;
    container.innerHTML = "";
    nameMap = nameMap || {};
    if (!rows || !rows.length) {
      container.innerHTML = '<p class="o-chatter-empty">No messages yet.</p>';
      return;
    }
    rows.forEach(function(r) {
      var authorName = r.author_id ? nameMap[r.author_id] || "User #" + (Array.isArray(r.author_id) ? r.author_id[0] : r.author_id) : "Unknown";
      var dateStr = r.date ? String(r.date).replace("T", " ").slice(0, 16) : "";
      var body = escapeBodyText(r.body || "");
      var attHtml = "";
      var aids = r.attachment_ids || [];
      if (aids.length) {
        var ids = aids.map(function(x) {
          return Array.isArray(x) ? x[0] : x;
        });
        attHtml = '<div class="o-chatter-attachments">' + ids.map(function(aid) {
          return '<a href="/web/attachment/download/' + encodeURIComponent(String(aid)) + '" target="_blank" rel="noopener" class="o-chatter-attachment-link">Attachment</a>';
        }).join("") + "</div>";
      }
      var div = document.createElement("div");
      div.className = "chatter-msg o-chatter-msg";
      div.innerHTML = '<div class="o-chatter-msg-meta">' + escAttr2(authorName) + " \xB7 " + escAttr2(dateStr) + '</div><div class="o-chatter-msg-body">' + body + "</div>" + attHtml;
      container.appendChild(div);
    });
  }
  function setChatterError(container, message) {
    if (!container) return;
    container.innerHTML = '<p class="o-chatter-error">' + escAttr2(message || "Could not load messages.") + "</p>";
  }

  // addons/web/static/src/app/kanban_card_chrome.js
  var kanban_card_chrome_exports = {};
  __export(kanban_card_chrome_exports, {
    buildKanbanCardHtml: () => buildKanbanCardHtml
  });
  function escAttr3(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }
  function escHtml4(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }
  function buildKanbanCardHtml(record, options) {
    const opts = options || {};
    const fields = Array.isArray(opts.fields) ? opts.fields : ["name", "expected_revenue", "date_deadline"];
    const draggable = opts.onStageChange ? ' draggable="true"' : "";
    const rid = record && record.id != null ? String(record.id) : "";
    const name = (record && record.name != null ? record.name : "\u2014").replace(/</g, "&lt;");
    let html = '<div class="kanban-card o-kanban-card o-card-gradient" data-id="' + escAttr3(rid) + '"' + draggable + ">";
    html += '<div class="o-kanban-card-head"><label class="o-kanban-card-select-row"><input type="checkbox" class="kanban-select" data-id="' + escAttr3(rid) + '"><strong class="o-kanban-card-title">' + name + "</strong></label></div>";
    html += '<div class="o-kanban-card-body">';
    if (typeof opts.cardTemplate === "function") {
      html += '<div class="kanban-template">' + String(opts.cardTemplate(record) || "") + "</div>";
    }
    fields.forEach(function(fname) {
      if (fname === "name") return;
      const v = record[fname];
      if (v == null || v === "") return;
      let disp = v;
      if (Array.isArray(disp) && disp.length) disp = disp[1] != null ? disp[1] : disp[0];
      html += '<div class="o-kanban-card-field" data-field="' + escAttr3(fname) + '"><span class="o-kanban-card-field-value">' + escHtml4(disp) + "</span></div>";
    });
    html += "</div></div>";
    return html;
  }

  // addons/web/static/src/app/graph_view_chrome.js
  (function() {
    function escAttr4(v) {
      return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    }
    function buildToolbarHtml(options) {
      var o = options || {};
      var viewSwitcherHtml = o.viewSwitcherHtml || "";
      var graphType = o.graphType || "bar";
      var searchTerm = o.searchTerm || "";
      var model = o.model || "";
      var addLabel = o.addLabel || "Add";
      var types = ["bar", "line", "pie"];
      var html = '<div class="o-graph-toolbar o-graph-toolbar-chrome">';
      html += viewSwitcherHtml;
      html += '<span class="o-graph-type-switcher graph-type-switcher" role="group" aria-label="Chart type">';
      types.forEach(function(t) {
        var active = t === graphType;
        html += '<button type="button" class="o-graph-type-btn btn-graph-type' + (active ? " active" : "") + '" data-type="' + escAttr4(t) + '">' + (t.charAt(0).toUpperCase() + t.slice(1)) + "</button>";
      });
      html += "</span>";
      html += '<div role="search" class="o-graph-search-wrap o-list-fallback-search">';
      html += '<input type="text" id="list-search" class="o-graph-search-field o-list-search-field" placeholder="Search..." aria-label="Search records" value="' + escAttr4(searchTerm) + '">';
      html += '<button type="button" id="btn-search" class="o-btn o-graph-search-btn o-list-toolbar-btn o-list-toolbar-btn--primary">Search</button>';
      if (model === "crm.lead") {
        html += '<select id="list-stage-filter" class="o-graph-stage-select o-list-toolbar-select" aria-label="Stage"><option value="">All stages</option></select>';
      }
      html += '<button type="button" id="btn-add" class="o-btn o-graph-add-btn o-list-toolbar-btn o-list-toolbar-btn--primary">' + escAttr4(addLabel) + "</button>";
      html += "</div></div>";
      return html;
    }
    window.AppCore = window.AppCore || {};
    window.AppCore.GraphViewChrome = { buildToolbarHtml };
  })();

  // addons/web/static/src/app/pivot_view_chrome.js
  (function() {
    function escAttr4(v) {
      return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    }
    function buildToolbarHtml(options) {
      var o = options || {};
      var viewSwitcherHtml = o.viewSwitcherHtml || "";
      var searchTerm = o.searchTerm || "";
      var model = o.model || "";
      var addLabel = o.addLabel || "Add";
      var html = '<div class="o-pivot-toolbar o-pivot-toolbar-chrome">';
      html += viewSwitcherHtml;
      html += '<button type="button" id="btn-pivot-flip" class="o-pivot-toolbar-btn o-btn o-list-toolbar-btn o-list-toolbar-btn--muted">Flip axes</button>';
      html += '<button type="button" id="btn-pivot-download" class="o-pivot-toolbar-btn o-btn o-list-toolbar-btn o-list-toolbar-btn--muted">Download CSV</button>';
      html += '<div role="search" class="o-pivot-search-wrap o-list-fallback-search">';
      html += '<input type="text" id="list-search" class="o-pivot-search-field o-list-search-field" placeholder="Search..." aria-label="Search records" value="' + escAttr4(searchTerm) + '">';
      html += '<button type="button" id="btn-search" class="o-btn o-pivot-search-btn o-list-toolbar-btn o-list-toolbar-btn--primary">Search</button>';
      if (model === "crm.lead") {
        html += '<select id="list-stage-filter" class="o-pivot-stage-select o-list-toolbar-select" aria-label="Stage"><option value="">All stages</option></select>';
      }
      html += '<button type="button" id="btn-add" class="o-btn o-pivot-add-btn o-list-toolbar-btn o-list-toolbar-btn--primary">' + escAttr4(addLabel) + "</button>";
      html += "</div></div>";
      return html;
    }
    window.AppCore = window.AppCore || {};
    window.AppCore.PivotViewChrome = { buildToolbarHtml };
  })();

  // addons/web/static/src/app/calendar_view_chrome.js
  (function() {
    function escAttr4(v) {
      return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    }
    function buildToolbarHtml(options) {
      var o = options || {};
      var viewSwitcherHtml = o.viewSwitcherHtml || "";
      var monthTitle = o.monthTitle || "";
      var searchTerm = o.searchTerm || "";
      var addLabel = o.addLabel || "Add";
      var html = '<div class="o-calendar-toolbar o-calendar-toolbar-chrome">';
      html += viewSwitcherHtml;
      html += '<button type="button" id="cal-prev" class="o-calendar-nav-btn o-btn o-list-toolbar-btn o-list-toolbar-btn--muted" aria-label="Previous month">Prev</button>';
      html += '<span id="cal-title" class="o-calendar-month-title">' + escAttr4(monthTitle) + "</span>";
      html += '<button type="button" id="cal-next" class="o-calendar-nav-btn o-btn o-list-toolbar-btn o-list-toolbar-btn--muted" aria-label="Next month">Next</button>';
      html += '<button type="button" id="cal-today" class="o-calendar-nav-btn o-btn o-list-toolbar-btn o-list-toolbar-btn--muted">Today</button>';
      html += '<div role="search" class="o-calendar-search-wrap o-list-fallback-search">';
      html += '<input type="text" id="list-search" class="o-calendar-search-field o-list-search-field" placeholder="Search..." aria-label="Search records" value="' + escAttr4(searchTerm) + '">';
      html += '<button type="button" id="btn-search" class="o-btn o-calendar-search-btn o-list-toolbar-btn o-list-toolbar-btn--primary">Search</button>';
      html += '<button type="button" id="btn-add" class="o-btn o-calendar-add-btn o-list-toolbar-btn o-list-toolbar-btn--primary">' + escAttr4(addLabel) + "</button>";
      html += "</div></div>";
      return html;
    }
    window.AppCore = window.AppCore || {};
    window.AppCore.CalendarViewChrome = { buildToolbarHtml };
  })();

  // addons/web/static/src/app/main.js
  function registerModernViewFacades() {
    window.AppCore = window.AppCore || {};
    window.AppCore.ListControlPanel = list_control_panel_exports;
    window.AppCore.FormFooterActions = form_footer_actions_exports;
    window.AppCore.BreadcrumbStrip = breadcrumb_strip_exports;
    window.AppCore.KanbanControlStrip = kanban_control_strip_exports;
    window.AppCore.ChatterStrip = chatter_strip_exports;
    window.AppCore.KanbanCardChrome = kanban_card_chrome_exports;
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
    window.ERPFrontendRuntime.menuUtils = menu_utils_exports;
    if (env.services.menu && typeof env.services.menu.load === "function") {
      env.services.menu.load(false).catch(function() {
      });
    }
    const app = new WebClient(env, document.getElementById("webclient"));
    app.mount();
    const runtime = {
      env,
      app,
      version: bootstrap.version,
      boot: bootModernWebClient,
      menuUtils: menu_utils_exports
    };
    window.__ERPModernWebClientRuntime = runtime;
    window.ERPFrontendRuntime = runtime;
    return runtime;
  }
  bootModernWebClient();
})();
//# sourceMappingURL=modern_webclient.js.map
