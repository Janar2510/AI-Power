/**
 * Compatibility shim — SearchModel is defined in search/search_model.js (Phase 1.246 G2).
 * web.assets_web loads search/search_model.js before this file.
 */
(function () {
  window.AppCore = window.AppCore || {};
  if (!window.AppCore.SearchModel && window.__ERP_SearchLayer && window.__ERP_SearchLayer.SearchModel) {
    window.AppCore.SearchModel = window.__ERP_SearchLayer.SearchModel;
  }
})();
