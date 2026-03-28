/**
 * Phase 771: Legacy route entrypoints exposed for tests, devtools, and future RouterService wiring.
 * main.js assigns real implementations after the IIFE defines them.
 */
(function () {
  window.ErpLegacyRouter = window.ErpLegacyRouter || {};
  if (typeof window.ErpLegacyRouter.route !== "function") {
    window.ErpLegacyRouter.route = function () {};
  }
  if (typeof window.ErpLegacyRouter.routeApply !== "function") {
    window.ErpLegacyRouter.routeApply = function () {};
  }
  if (typeof window.ErpLegacyRouter.routeInternal !== "function") {
    window.ErpLegacyRouter.routeInternal = function () {};
  }
  if (typeof window.ErpLegacyRouter.routeApplyInternal !== "function") {
    window.ErpLegacyRouter.routeApplyInternal = function () {};
  }
})();
