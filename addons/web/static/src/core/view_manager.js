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
  };

  window.AppCore.ViewManager = ViewManager;
})();
