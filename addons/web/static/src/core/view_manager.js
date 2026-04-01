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
     * Phase 693: prefetch views via env.services.view.loadViews (warms cache; debug __ERP_lastLoadViews).
     */
    openFromActWindow(action, options) {
      const rt = window.__ERPModernWebClientRuntime;
      const opts = options || {};
      const viewSvc = rt && rt.env && rt.env.services && rt.env.services.view;
      const resModel = action && (action.res_model || action.resModel);
      const svc = rt && rt.env && rt.env.services && rt.env.services.action;
      const runLegacyFallback = function () {
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
      };
      const runDoAction = function () {
        if (svc && typeof svc.doAction === "function" && action) {
          return Promise.resolve(svc.doAction(action, opts));
        }
        return runLegacyFallback();
      };
      if (viewSvc && typeof viewSvc.loadViews === "function" && resModel) {
        const loadP = viewSvc.loadViews(resModel, [["list"], ["form"]]);
        const deadlineMs = 7000;
        const raced = Promise.race([
          Promise.resolve(loadP),
          new Promise(function (_, rej) {
            setTimeout(function () {
              rej(new Error("loadViews deadline"));
            }, deadlineMs);
          }),
        ]);
        return raced
          .then(function (payload) {
            if (typeof window !== "undefined") {
              var fk =
                payload && payload.fields && typeof payload.fields === "object"
                  ? Object.keys(payload.fields)
                  : [];
              window.__ERP_lastLoadViews = {
                resModel: String(resModel),
                views: (payload && payload.views) || [],
                fieldsKeyCount: fk.length,
                fieldsSampleKeys: fk.slice(0, 8),
                source: "openFromActWindow",
                ts: Date.now(),
              };
              if (window.__ERP_DEBUG_LOAD_VIEWS && typeof console !== "undefined" && console.debug) {
                console.debug("[ERP] loadViews", window.__ERP_lastLoadViews);
              }
            }
            return runDoAction();
          })
          .catch(function () {
            return runDoAction();
          });
      }
      return runDoAction();
    },
    /**
     * Phase 682: single entry for list-route act_window sync; main.js injects getActionForRoute.
     */
    syncListRouteFromMain(route, getActionForRoute, options) {
      if (!route || typeof getActionForRoute !== "function") {
        return Promise.resolve(null);
      }
      const action = getActionForRoute(route);
      if (!action) {
        return Promise.resolve(null);
      }
      return this.openFromActWindow(action, options || { source: "viewManagerSyncList" });
    },
  };

  window.AppCore.ViewManager = ViewManager;
})();
