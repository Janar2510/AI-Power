/**
 * i18n service - translation _(...) with server catalog (Phase 94)
 */
(function () {
  let _catalog = {};
  const i18n = {
    _(msg) { return _catalog[msg] || msg; },
    loadTranslations(catalog) { Object.assign(_catalog, catalog || {}); },
    loadFromServer(lang) {
      const l = lang || 'en_US';
      return fetch('/web/translations?lang=' + encodeURIComponent(l), { credentials: 'include' })
        .then(function (r) { return r.ok ? r.json() : {}; })
        .then(function (c) {
          Object.assign(_catalog, c || {});
          return _catalog;
        })
        .catch(function () { return _catalog; });
    }
  };
  window.Services = window.Services || {};
  window.Services.i18n = i18n;
})();
