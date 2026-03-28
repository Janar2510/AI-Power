/**
 * Views service - loads view/action/menu definitions from server
 */
(function () {
  let _cache = null;
  var _MENUS_CACHE_KEY = 'erp_menus';
  var _MENUS_HASH_KEY = 'erp_menus_hash';

  function _simpleHash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return h.toString(36);
  }

  function _tryLoadMenusFromCache() {
    try {
      var raw = localStorage.getItem(_MENUS_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function _cacheMenus(menus, hash) {
    try {
      localStorage.setItem(_MENUS_CACHE_KEY, JSON.stringify(menus));
      localStorage.setItem(_MENUS_HASH_KEY, hash);
    } catch (e) { /* quota exceeded or private mode */ }
  }

  const views = {
    load() {
      if (_cache) return Promise.resolve(_cache);
      return fetch('/web/load_views', { method: 'GET', credentials: 'include' })
        .then(r => {
          if (!r.ok) return null;
          const ct = r.headers.get('Content-Type') || '';
          if (!ct.includes('application/json')) return null;
          return r.json();
        })
        .then(data => {
          _cache = data || { views: {}, actions: {}, menus: [] };
          if (_cache.menus && _cache.menus.length) {
            var menuStr = JSON.stringify(_cache.menus);
            var newHash = _simpleHash(menuStr);
            var oldHash = '';
            try { oldHash = localStorage.getItem(_MENUS_HASH_KEY) || ''; } catch (e) { /* noop */ }
            if (newHash !== oldHash) {
              _cacheMenus(_cache.menus, newHash);
            }
          }
          return _cache;
        })
        .catch(() => {
          var cachedMenus = _tryLoadMenusFromCache();
          _cache = { views: {}, actions: {}, menus: cachedMenus || [] };
          return _cache;
        });
    },

    getView(model, type) {
      const viewsByModel = (_cache && _cache.views) || {};
      const list = viewsByModel[model] || [];
      return list.find(v => v.type === type) || null;
    },

    getAction(id) {
      return (_cache && _cache.actions && _cache.actions[id]) || null;
    },

    getMenus() {
      return (_cache && _cache.menus) || [];
    },

    getFieldsMeta(model) {
      return (_cache && _cache.fields_meta && _cache.fields_meta[model]) || null;
    },

    /** Phase 110: report name by model from ir.actions.report (metadata-driven). */
    getReportName(model) {
      const reports = _cache && _cache.reports;
      return (reports && reports[model]) || null;
    },

    getFieldMeta(model, fname) {
      var meta = this.getFieldsMeta(model);
      return meta ? (meta[fname] || null) : null;
    },

    clearCache() { _cache = null; },

    /**
     * Batch loadViews — returns cached arch+fields for the requested view types in one call.
     * Mirrors Odoo 19 view_service.loadViews(resModel, requestedViewTypes).
     * @param {string} model
     * @param {Array<string|[string,number]>} viewTypes — e.g. ['list','form'] or [['list',false],['form',false]]
     * @returns {Promise<{views: Object, fields: Object}>}
     */
    loadViews(model, viewTypes) {
      return this.load().then(function () {
        var modes = (viewTypes || ['list', 'form']).map(function (v) {
          return Array.isArray(v) ? v[0] : v;
        });
        var result = {};
        modes.forEach(function (mode) {
          var v = views.getView(model, mode);
          if (v) result[mode] = v;
        });
        var fields = views.getFieldsMeta(model) || {};
        return { views: result, fields: fields };
      });
    },
  };

  /**
   * View type registry — maps view type strings to renderer/component references.
   * Lazy loading: register({ type, loader }) and the actual component loads on first use.
   */
  var _viewRegistry = {};

  var viewRegistry = {
    add: function (type, entry) {
      _viewRegistry[type] = entry;
    },
    get: function (type) {
      return _viewRegistry[type] || null;
    },
    getAll: function () {
      return Object.assign({}, _viewRegistry);
    },
    /**
     * Lazy resolve — if entry has a `loader` function, call it once and cache the result.
     * @param {string} type
     * @returns {Promise<Object|null>}
     */
    resolve: function (type) {
      var entry = _viewRegistry[type];
      if (!entry) return Promise.resolve(null);
      if (entry._resolved) return Promise.resolve(entry._resolved);
      if (typeof entry.loader === 'function') {
        return Promise.resolve(entry.loader()).then(function (resolved) {
          entry._resolved = resolved;
          return resolved;
        });
      }
      return Promise.resolve(entry);
    },
  };

  window.Services = window.Services || {};
  window.Services.views = views;
  window.Services.viewRegistry = viewRegistry;
})();
