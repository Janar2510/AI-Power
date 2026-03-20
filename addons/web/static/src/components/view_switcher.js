(function () {
  window.UIComponents = window.UIComponents || {};

  var LABELS = {
    list: "List",
    kanban: "Kanban",
    graph: "Graph",
    pivot: "Pivot",
    calendar: "Calendar",
    activity: "Activity",
    gantt: "Gantt",
  };

  window.UIComponents.ViewSwitcher = {
    renderHTML: function renderHTML(options) {
      var opts = options || {};
      var route = opts.route || "";
      var modes = opts.modes || [];
      var currentView = opts.currentView || "list";
      if (!modes.length || modes.length < 2) return "";
      var html = '<span class="o-view-switcher" data-route="' + String(route).replace(/"/g, "&quot;") + '">';
      modes.forEach(function (mode) {
        var active = mode === currentView;
        html += '<button type="button" class="btn-view o-btn ' + (active ? "o-btn-primary active" : "o-btn-secondary") + '" data-view="' + String(mode).replace(/"/g, "&quot;") + '">' + (LABELS[mode] || mode) + "</button>";
      });
      html += "</span>";
      return html;
    },
  };
})();
