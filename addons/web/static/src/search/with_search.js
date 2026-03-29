/**
 * WithSearch-style shell — binds SearchModel + domain builder for list/form/kanban (Phase 1.246 G2).
 */
(function () {
  function create(opts) {
    opts = opts || {};
    var model = opts.model || "";
    var viewsSvc = opts.viewsSvc || (window.Services && window.Services.views);
    var stateRef = opts.state || {};
    var SM = window.AppCore && window.AppCore.SearchModel;
    if (!SM) {
      return { searchModel: null, getDomain: function () { return []; } };
    }
    var sm = new SM(model, viewsSvc, stateRef);
    return {
      searchModel: sm,
      getDomain: function (ctx) {
        return sm.buildDomain(ctx || {});
      },
    };
  }

  window.__ERP_WithSearch = { create: create };
})();
