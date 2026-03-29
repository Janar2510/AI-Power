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
      // Notify onAction hooks
      _onActionHooks.forEach(function (hook) {
        try { hook({ type: type, action: def, options: options }); } catch (_e) {}
      });
      if (type === "ir.actions.act_window" || type === "window") {
        return this._doWindowAction(def, options);
      }
      if (type === "ir.actions.act_url" || type === "url") {
        return this._doUrlAction(def, options);
      }
      if (type === "ir.actions.act_client" || type === "ir.actions.client" || type === "client") {
        return this._doClientAction(def, options);
      }
      if (type === "ir.actions.report" || type === "report") {
        return this._doReportAction(def, options);
      }
      if (type === "ir.actions.server" || type === "server") {
        return this._doServerAction(def, options);
      }
      throw new Error("Unknown action type: " + type);
    },
    _doWindowAction(actionDef) {
      return {
        type: "window",
        resModel: actionDef.res_model || actionDef.resModel,
        viewMode: actionDef.view_mode || actionDef.viewMode || "list",
        target: actionDef.target || "current",
        action: actionDef,
      };
    },
    _doUrlAction(actionDef) {
      const url = actionDef.url || actionDef.target_url || "#";
      if (url.startsWith("http") || url.startsWith("//")) {
        window.open(url, actionDef.target || "_blank");
      } else {
        window.location.hash = url.startsWith("#") ? url : "#" + url;
      }
      return undefined;
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
      if (reportName && ids && ids.length) {
        const path = "/report/html/" + reportName + "/" + ids.join(",");
        window.open(path, "_blank", "noopener");
        return { type: "report", reportName: reportName, ids: ids, url: path };
      }
      return { type: "report", error: "missing report name or ids", action: actionDef };
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
