/**
 * Action manager — window, client, URL, report (Phase 773+).
 * Stack + client registry are optional extensions for modern env.services.action bridges.
 *
 * **Integration:** `core/action_manager.js` and `app/services.js` expose `env.services.action`;
 * `ViewManager.openFromActWindow` and legacy `main.js` (`routeApplyInternal`, list/kanban toolbars)
 * consume `doAction` / client tags (`reload`, `home`, `import`). Extend here for new client actions;
 * register parallel handlers in `ViewManager` when navigation must sync the action stack.
 */
(function () {
  const _stack = [];
  const _clientRegistry = {};

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
      if (type === "ir.actions.act_window" || type === "window") {
        return this._doWindowAction(def, options);
      }
      if (type === "ir.actions.act_url" || type === "url") {
        return this._doUrlAction(def, options);
      }
      if (type === "ir.actions.act_client" || type === "client") {
        return this._doClientAction(def, options);
      }
      if (type === "ir.actions.report" || type === "report") {
        return this._doReportAction(def, options);
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
      const reg = tag ? _clientRegistry[String(tag)] : null;
      if (typeof reg === "function") {
        return reg(actionDef, options) || { type: "client", tag: tag, action: actionDef, handled: true };
      }
      return { type: "client", tag: tag, action: actionDef, handled: false };
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

  window.Services = window.Services || {};
  window.Services.action = action;
})();
