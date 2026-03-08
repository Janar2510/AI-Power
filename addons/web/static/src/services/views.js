/**
 * Views service - loads view/action/menu definitions from server
 */
(function () {
  let _cache = null;

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
          return _cache;
        })
        .catch(() => {
          _cache = { views: {}, actions: {}, menus: [] };
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

    getFieldMeta(model, fname) {
      var meta = this.getFieldsMeta(model);
      return meta ? (meta[fname] || null) : null;
    },

    clearCache() { _cache = null; }
  };

  window.Services = window.Services || {};
  window.Services.views = views;
})();
