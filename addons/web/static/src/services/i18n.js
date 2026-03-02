/**
 * i18n service - translation stub _(...)
 */
(function () {
  let _catalog = {};
  const i18n = {
    _(msg) { return _catalog[msg] || msg; },
    loadTranslations(catalog) { Object.assign(_catalog, catalog || {}); }
  };
  window.Services = window.Services || {};
  window.Services.i18n = i18n;
})();
