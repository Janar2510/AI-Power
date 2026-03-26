(function () {
  window.AppCore = window.AppCore || {};

  const ViewManager = {
    renderView(container, type, viewDef, data, options) {
      const t = String(type || "list");
      const renderers = window.ViewRenderers || {};
      const renderer = renderers[t];
      if (!renderer || typeof renderer.render !== "function") {
        container.innerHTML = '<div class="o-empty">Renderer not available: ' + t + "</div>";
        return;
      }
      renderer.render(container, viewDef || {}, data || [], options || {});
    },
    getFormFields(viewDef) {
      const fields = (viewDef && viewDef.fields) || [];
      return Array.isArray(fields) ? fields : [];
    },
    getTitle(model, count) {
      const name = String(model || "Records");
      return count != null ? name + " (" + count + ")" : name;
    },
    loadRecords(rpc, model, domain, fields, limit) {
      if (!rpc || typeof rpc.callKw !== "function") {
        return Promise.resolve([]);
      }
      return rpc.callKw(model, "search_read", [domain || []], {
        fields: fields || ["id", "name"],
        limit: limit || 80,
      });
    },
    deleteRecord(rpc, model, id) {
      if (!rpc || typeof rpc.callKw !== "function" || !id) {
        return Promise.resolve(false);
      }
      return rpc.callKw(model, "unlink", [[id]], {});
    },
    /**
     * Phase 649: single entry to open a list/form route from ir.actions.act_window metadata.
     * Prefer modular env.services.action (aligns with Odoo view_service + action pipeline).
     */
    openFromActWindow(action, options) {
      const rt = window.__ERPModernWebClientRuntime;
      const svc = rt && rt.env && rt.env.services && rt.env.services.action;
      if (svc && typeof svc.doAction === "function" && action) {
        return Promise.resolve(svc.doAction(action, options || {}));
      }
      const mu =
        (rt && rt.menuUtils) ||
        (window.ERPFrontendRuntime && window.ERPFrontendRuntime.menuUtils);
      if (mu && typeof mu.actionToRoute === "function") {
        const route = mu.actionToRoute(action);
        if (route) {
          window.location.hash = "#" + route;
          return Promise.resolve(route);
        }
      }
      return Promise.resolve(null);
    },
  };

  window.AppCore.ViewManager = ViewManager;
})();
