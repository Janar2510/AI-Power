/**
 * SearchModel — search view filters, group-by, term; builds combined domain (Phase 2a).
 */
(function () {
  function SearchModel(model, viewsSvc, listStateRef) {
    this.model = model;
    this.viewsSvc = viewsSvc || null;
    this.state = listStateRef || {};
  }

  SearchModel.prototype.getSearchView = function () {
    return this.viewsSvc && this.viewsSvc.getView ? this.viewsSvc.getView(this.model, "search") : null;
  };

  SearchModel.prototype.toggleFilter = function (name) {
    var cur = this.state.activeSearchFilters || [];
    var idx = cur.indexOf(name);
    if (idx >= 0) this.state.activeSearchFilters = cur.filter(function (_, i) { return i !== idx; });
    else this.state.activeSearchFilters = cur.concat(name);
    this._emit("change");
  };

  SearchModel.prototype.setGroupBy = function (groupBy) {
    this.state.groupBy = groupBy || null;
    this._emit("change");
  };

  SearchModel.prototype.setSearchTerm = function (term) {
    this.state.searchTerm = term || "";
    this._emit("change");
  };

  SearchModel.prototype._listeners = null;

  SearchModel.prototype.subscribe = function (fn) {
    if (!this._listeners) this._listeners = [];
    this._listeners.push(fn);
  };

  SearchModel.prototype._emit = function (evt) {
    (this._listeners || []).forEach(function (fn) {
      try {
        fn(evt, this);
      } catch (e) {}
    }, this);
  };

  /**
   * Build domain the same way as main.loadRecords (without saved filter merge — caller passes that).
   * @param {object} ctx — actionDomain, searchTerm, stageFilter, model, savedFilterDomain, parseFilterDomain(uid), buildSearchDomain(model, term), uid, skipSearchDomain
   */
  SearchModel.prototype.buildDomain = function (ctx) {
    ctx = ctx || {};
    var domain = (ctx.actionDomain || []).slice();
    var model = ctx.model || this.model;
    var uid = ctx.uid != null ? ctx.uid : 1;
    if (ctx.savedFilterDomain && ctx.savedFilterDomain.length) {
      return domain.concat(ctx.savedFilterDomain);
    }
    if (!ctx.skipSearchDomain) {
      var bsd = ctx.buildSearchDomain;
      if (bsd && ctx.searchTerm && String(ctx.searchTerm).trim()) {
        var sd = bsd(model, String(ctx.searchTerm).trim());
        if (sd && sd.length) domain = domain.concat(sd);
      }
    }
    if (model === "crm.lead" && ctx.stageFilter) {
      domain = domain.concat([["stage_id", "=", ctx.stageFilter]]);
    }
    var sv = this.getSearchView();
    var filters = (sv && sv.filters) || [];
    (this.state.activeSearchFilters || []).forEach(function (fname) {
      var f = filters.find(function (x) { return x.name === fname && x.domain; });
      if (f && f.domain && ctx.parseFilterDomain) {
        var fd = ctx.parseFilterDomain(f.domain, uid);
        if (fd && fd.length) domain = domain.concat(fd);
      }
    });
    return domain;
  };

  window.AppCore = window.AppCore || {};
  window.AppCore.SearchModel = SearchModel;
})();
