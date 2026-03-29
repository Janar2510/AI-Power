/**
 * Search layer — SearchModel (Phase 1.246 G2).
 * First-class search package; same API as former core/search_model.js.
 */
(function () {
  function SearchModel(model, viewsSvc, listStateRef) {
    this.model = model;
    this.viewsSvc = viewsSvc || null;
    this.state = listStateRef || {};
    if (!Array.isArray(this.state.facets)) this.state.facets = [];
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

  SearchModel.prototype._facetKey = function (facet) {
    if (!facet) return "";
    return [facet.type || "custom", facet.name || "", facet.value || "", facet.operator || "", facet.label || ""].join("::");
  };

  SearchModel.prototype.addFacet = function (facet) {
    if (!facet || !facet.label) return;
    var next = {
      type: facet.type || "custom",
      name: facet.name || "",
      operator: facet.operator || "ilike",
      value: facet.value,
      label: facet.label,
      removable: facet.removable !== false,
      domain: Array.isArray(facet.domain) ? facet.domain.slice() : null,
    };
    var key = this._facetKey(next);
    var exists = (this.state.facets || []).some(function (f) { return this._facetKey(f) === key; }, this);
    if (!exists) this.state.facets = (this.state.facets || []).concat(next);
    this._emit("change");
  };

  SearchModel.prototype.removeFacet = function (facetOrIdx) {
    var arr = this.state.facets || [];
    if (!arr.length) return;
    if (typeof facetOrIdx === "number") {
      this.state.facets = arr.filter(function (_, i) { return i !== facetOrIdx; });
    } else {
      var key = this._facetKey(facetOrIdx);
      this.state.facets = arr.filter(function (f) { return this._facetKey(f) !== key; }, this);
    }
    this._emit("change");
  };

  SearchModel.prototype.getFacets = function () {
    return (this.state.facets || []).slice();
  };

  SearchModel.prototype.renderFacets = function () {
    var facets = this.getFacets();
    if (!facets.length) return "";
    var esc = function (s) {
      return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    };
    var html = '<div class="o-facet-bar" role="list" aria-label="Active filters">';
    facets.forEach(function (f, idx) {
      html += '<span class="o-filter-chip facet-chip" role="listitem" data-facet-idx="' + idx + '">';
      html += esc(f.label);
      if (f.removable !== false) {
        html += ' <button type="button" class="o-filter-chip-remove facet-remove" data-facet-remove="' + idx + '" aria-label="Remove">&times;</button>';
      }
      html += "</span>";
    });
    html += "</div>";
    return html;
  };

  SearchModel.prototype.applyDefaultsFromContext = function (ctx) {
    var c = ctx || {};
    Object.keys(c).forEach(function (k) {
      if (k.indexOf("search_default_") !== 0) return;
      var field = k.slice("search_default_".length);
      var val = c[k];
      if (val == null || val === false || val === "") return;
      this.addFacet({
        type: "field",
        name: field,
        operator: typeof val === "number" ? "=" : "ilike",
        value: val,
        label: field + ": " + val,
        domain: [[field, typeof val === "number" ? "=" : "ilike", val]],
      });
    }, this);
  };

  SearchModel.prototype.getAutocompleteSuggestions = function (term) {
    var q = String(term || "").trim().toLowerCase();
    if (!q) return [];
    var sv = this.getSearchView();
    var fields = (sv && sv.fields) || [];
    var out = [];
    fields.forEach(function (f) {
      var name = f.name || "";
      var label = f.string || name;
      if (!name) return;
      if (label.toLowerCase().indexOf(q) >= 0 || name.toLowerCase().indexOf(q) >= 0 || q.length >= 2) {
        out.push({
          type: "field",
          name: name,
          operator: "ilike",
          value: term,
          label: label + ": " + term,
          domain: [[name, "ilike", term]],
        });
      }
    });
    return out.slice(0, 8);
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

  SearchModel.prototype.getSearchPanelSections = function () {
    var sv = this.getSearchView();
    var filters = (sv && sv.filters) || [];
    var byCat = {};
    filters.forEach(function (f) {
      var cat = f.category || f.panel || "Filters";
      if (!byCat[cat]) byCat[cat] = [];
      byCat[cat].push({ label: f.string || f.name || "", value: f.name || "" });
    });
    return Object.keys(byCat).map(function (title) {
      return { title: title, items: byCat[title] };
    });
  };

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
    (this.state.facets || []).forEach(function (f) {
      if (f && Array.isArray(f.domain) && f.domain.length) {
        domain = domain.concat(f.domain);
      }
    });
    return domain;
  };

  window.__ERP_SearchLayer = window.__ERP_SearchLayer || {};
  window.__ERP_SearchLayer.SearchModel = SearchModel;
  window.AppCore = window.AppCore || {};
  window.AppCore.SearchModel = SearchModel;
})();
