/**
 * Generic view resolver — maps view type to app modules + viewRegistry (Phase 1.246 G3).
 */
(function () {
  function _getModuleForType(type) {
    var t = String(type || "list").split(",")[0].trim();
    var map = {
      list: function () {
        return window.AppCore && window.AppCore.ListViewModule;
      },
      form: function () {
        return window.AppCore && window.AppCore.FormViewModule;
      },
      kanban: function () {
        return window.AppCore && window.AppCore.KanbanViewModule;
      },
      graph: function () {
        return window.AppCore && window.AppCore.GraphViewModule;
      },
      pivot: function () {
        return window.AppCore && window.AppCore.PivotViewModule;
      },
      calendar: function () {
        return window.AppCore && window.AppCore.CalendarViewModule;
      },
      gantt: function () {
        return window.AppCore && window.AppCore.GanttViewModule;
      },
      activity: function () {
        return window.AppCore && window.AppCore.ActivityViewModule;
      },
    };
    var fn = map[t];
    return fn ? fn() : null;
  }

  function registerDefaultViews() {
    var reg = window.Services && window.Services.viewRegistry;
    if (!reg || reg.__erpViewsRegistered) return;
    reg.__erpViewsRegistered = true;
    ["list", "form", "kanban", "graph", "pivot", "calendar", "gantt", "activity"].forEach(function (t) {
      reg.add(t, {
        type: t,
        getModule: function () {
          return _getModuleForType(t);
        },
      });
    });
  }

  /**
   * Resolve view entry for act_window-style navigation.
   * @param {{ view_mode?: string, viewMode?: string }} payload
   */
  function resolve(payload) {
    registerDefaultViews();
    var mode = String((payload && (payload.view_mode || payload.viewMode)) || "list").split(",")[0].trim();
    var reg = window.Services && window.Services.viewRegistry;
    var entry = reg && reg.get(mode);
    if (entry && entry.getModule) return { type: mode, module: entry.getModule(), entry: entry };
    return { type: mode, module: _getModuleForType(mode), entry: entry };
  }

  window.__ERP_ViewResolver = {
    registerDefaultViews: registerDefaultViews,
    resolve: resolve,
    getModuleForType: _getModuleForType,
  };

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", registerDefaultViews);
    } else {
      registerDefaultViews();
    }
  }
})();
