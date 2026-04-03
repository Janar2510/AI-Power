/**
 * Action manager — window, client, URL, report, server (Phase 773+ / Track K1).
 * Stack + client registry are optional extensions for modern env.services.action bridges.
 *
 * K1 additions (post-1.246):
 *  - ir.actions.server: RPC call + optional chain
 *  - Full registry.category("actions") integration (resolves client action tags from env.registries)
 *  - onAction hook for cross-boundary listeners (analytics, debug, tour)
 *
 * **Integration:** `core/action_manager.js` and `app/services.js` expose `env.services.action`;
 * `ViewManager.openFromActWindow` and legacy `main.js` (`routeApplyInternal`, list/kanban toolbars)
 * consume `doAction` / client tags (`reload`, `home`, `import`). Extend here for new client actions;
 * register parallel handlers in `ViewManager` when navigation must sync the action stack.
 */
(function () {
  const _stack = [];
  const _clientRegistry = {};
  const _onActionHooks = new Set();

  const action = {
    /** @type {Array<{type: string, payload: object}>} */
    getStack() {
      return _stack.slice();
    },
    clearStack() {
      _stack.length = 0;
    },
    pushStackEntry(entry) {
      if (entry && typeof entry === "object") {
        _stack.push(entry);
      }
    },
    popStackEntry() {
      return _stack.pop() || null;
    },
    registerClientAction(tag, fn) {
      const t = String(tag || "");
      if (t && typeof fn === "function") {
        _clientRegistry[t] = fn;
      }
    },
    getClientAction(tag) {
      return _clientRegistry[String(tag || "")] || null;
    },
    doAction(actionDef, options) {
      const def = actionDef || {};
      const type = def.type || "ir.actions.act_window";
      const opts = options || {};
      // Notify onAction hooks
      _onActionHooks.forEach(function (hook) {
        try { hook({ type: type, action: def, options: opts }); } catch (_e) {}
      });
      // Push to in-memory stack for breadcrumb history
      _stack.push({ type, payload: def, options: opts });
      if (type === "ir.actions.act_window" || type === "window") {
        return this._doWindowAction(def, opts);
      }
      if (type === "ir.actions.act_url" || type === "url") {
        return this._doUrlAction(def, opts);
      }
      if (type === "ir.actions.act_client" || type === "ir.actions.client" || type === "client") {
        return this._doClientAction(def, opts);
      }
      if (type === "ir.actions.report" || type === "report") {
        return this._doReportAction(def, opts);
      }
      if (type === "ir.actions.server" || type === "server") {
        return this._doServerAction(def, opts);
      }
      throw new Error("Unknown action type: " + type);
    },
    _doWindowAction(actionDef, options) {
      const opts = options || {};
      const resModel = actionDef.res_model || actionDef.resModel || "";
      const viewMode = actionDef.view_mode || actionDef.viewMode || "list";
      const primaryView = viewMode.split(",")[0].trim() || "list";
      const resId = actionDef.res_id || actionDef.resId || opts.resId || null;
      const domain = actionDef.domain || opts.domain || [];
      const context = Object.assign({}, actionDef.context || {}, opts.context || {});
      const result = {
        type: "window",
        resModel,
        viewMode: primaryView,
        target: actionDef.target || "current",
        action: actionDef,
      };

      // Push a breadcrumb stack entry for back-navigation
      const stackEntry = {
        label: actionDef.name || actionDef.display_name || resModel,
        hash: window.location.hash,
      };
      if (window.ActionManager && typeof window.ActionManager.doAction === "function") {
        const stack = window.ActionManager.loadFromStorage ? window.ActionManager.loadFromStorage() : [];
        window.ActionManager.doAction(stack, stackEntry);
      }

      // Dispatch to OWL ActionContainer when mounted
      if (window.__ERP_OWL_ACTION_CONTAINER_MOUNTED) {
        const AB = window.AppCore && window.AppCore.ActionBus;
        if (AB && typeof AB.trigger === "function") {
          AB.trigger("ACTION_MANAGER:UPDATE", {
            viewType: primaryView,
            resModel,
            resId: resId || undefined,
            props: { domain, context, limit: actionDef.limit },
          });
        }
      } else {
        // Legacy path: update hash so the concat-bundle router picks it up
        const route = resModel.replace(/\./g, "_");
        const newHash = resId
          ? "#" + route + "/form/" + resId
          : "#" + route + "/" + primaryView;
        if (window.location.hash !== newHash) {
          window.location.hash = newHash;
        }
      }

      return result;
    },
    _doUrlAction(actionDef) {
      const url = actionDef.url || actionDef.target_url || "#";
      const target = actionDef.target || "_blank";
      if (url.startsWith("http") || url.startsWith("//")) {
        window.open(url, target === "current" ? "_self" : "_blank", "noopener");
      } else if (target === "current") {
        window.location.hash = url.startsWith("#") ? url : "#" + url;
      } else {
        window.open(url.startsWith("#") ? url : "#" + url, "_blank", "noopener");
      }
      return { type: "url", url };
    },
    _doClientAction(actionDef, options) {
      const tag = actionDef.tag || actionDef.name || actionDef.xml_id;
      // 1. Local registry
      const localReg = tag ? _clientRegistry[String(tag)] : null;
      if (typeof localReg === "function") {
        return localReg(actionDef, options) || { type: "client", tag: tag, action: actionDef, handled: true };
      }
      // 2. Modular env.registries.category("actions") via ERPFrontendRegistries
      const envReg = window.ERPFrontendRegistries;
      if (envReg && tag) {
        try {
          const entry = envReg.category("actions").get(String(tag));
          if (typeof entry === "function") {
            return entry(actionDef, options) || { type: "client", tag: tag, action: actionDef, handled: true };
          }
        } catch (_e) { /* registry may not exist yet */ }
      }
      return { type: "client", tag: tag, action: actionDef, handled: false };
    },

    /**
     * K1: ir.actions.server — calls /web/dataset/call_kw on the action model then chains result.
     */
    _doServerAction(actionDef, options) {
      const opts = options || {};
      const actionId = actionDef.id || actionDef.action_id;
      const orm = window.Services && window.Services.orm;
      if (!orm || !actionId) {
        return { type: "server", error: "missing orm or action id", action: actionDef };
      }
      const context = Object.assign(
        {},
        actionDef.context || {},
        opts.context || {},
        opts.active_ids ? { active_ids: opts.active_ids, active_id: opts.active_ids[0] } : {}
      );
      return orm.call("ir.actions.server", "run", [[actionId]], { context: context })
        .then(function (result) {
          if (result && result.type) {
            // Chain: server action returned another action
            return action.doAction(result, opts);
          }
          return { type: "server", result: result, action: actionDef };
        })
        .catch(function (err) {
          return { type: "server", error: err && err.message ? err.message : String(err), action: actionDef };
        });
    },
    _doReportAction(actionDef, options) {
      const opts = options || {};
      const reportName = actionDef.report_name || actionDef.reportName || actionDef.name;
      const resId = actionDef.res_id || actionDef.resId || (opts.active_id != null ? opts.active_id : null);
      const ids = actionDef.ids || opts.active_ids || (resId != null ? [resId] : []);
      const reportType = actionDef.report_type || "qweb-html";

      if (!reportName) {
        return { type: "report", error: "missing report name", action: actionDef };
      }
      if (!ids || !ids.length) {
        return { type: "report", error: "missing record ids", action: actionDef };
      }

      const format = reportType.includes("pdf") ? "pdf" : "html";
      const path = "/report/" + format + "/" + reportName + "/" + ids.join(",");

      // Use inline PDF viewer if available (prevents popup blocker issues)
      if (format === "pdf") {
        const PdfViewer = window.UIComponents && window.UIComponents.PdfViewer;
        if (PdfViewer && typeof PdfViewer.open === "function") {
          PdfViewer.open(path, actionDef.name || "Report");
          return { type: "report", reportName, ids, url: path, preview: true };
        }
      }

      window.open(path, "_blank", "noopener");
      return { type: "report", reportName, ids, url: path, preview: false };
    },
  };

  action.registerClientAction("reload", function () {
    window.location.reload();
    return { handled: true };
  });
  action.registerClientAction("home", function () {
    window.location.hash = "#home";
    return { handled: true };
  });
  action.registerClientAction("import", function (def) {
    const model = (def && (def.context && def.context.model)) || (def && def.params && def.params.model) || null;
    const hash = model ? "#import/" + String(model).replace(/\./g, "_") : "#import";
    window.location.hash = hash;
    return { handled: true };
  });

  /**
   * Phase 1.246 G4: single entry for object/action/report buttons — delegates to ActionManager.
   */
  action.doActionButton = function (opts) {
    if (window.ActionManager && typeof window.ActionManager.doActionButton === "function") {
      return window.ActionManager.doActionButton(opts || {});
    }
    return Promise.reject(new Error("ActionManager.doActionButton not available"));
  };

  /** Restore persisted action stack from sessionStorage (breadcrumb sync). */
  action.loadState = function () {
    if (window.ActionManager && typeof window.ActionManager.loadFromStorage === "function") {
      return Promise.resolve(window.ActionManager.loadFromStorage() || []);
    }
    return Promise.resolve([]);
  };

  /**
   * K1: Subscribe to all doAction calls for analytics/debug/tour hooks.
   * @param {(info: { type, action, options }) => void} fn
   * @returns {Function} unsubscribe
   */
  action.onAction = function (fn) {
    if (typeof fn === "function") _onActionHooks.add(fn);
    return function () { _onActionHooks.delete(fn); };
  };

  window.Services = window.Services || {};
  window.Services.action = action;
})();
