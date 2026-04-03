/**
 * Route Engine — OWL routing bridge + hash parsing utilities (Phase 1.250.15).
 *
 * Extracted from the main.js IIFE so the OWL/legacy routing decision can be
 * tested and reused independently.  main.js delegates _tryOwlRoute to
 * window.__ERP_tryOwlRoute which is set here.
 *
 * Public surface (all on window.__ERP_RouteEngine):
 *   tryOwlRoute(viewType, model, resId, extraProps) → boolean
 *   canMountOwl() → boolean
 *   parseDomainFromHash(hashSlice?) → any[]
 */
(function () {
  "use strict";

  /**
   * Return true when the OWL runtime is available, the ActionContainer is
   * mounted, and CSP allows OWL template compilation.
   *
   * Single source of truth; replaces the duplicated inline checks that previously
   * existed in both main.js._tryOwlRoute and app/owl_bridge.js.
   */
  function canMountOwl() {
    var fb = typeof window !== "undefined" && window.__erpFrontendBootstrap;
    if (!fb || fb.cspScriptEvalBlocked !== false) return false;
    if (!window.__ERP_OWL_ACTION_CONTAINER_MOUNTED) return false;
    return true;
  }

  /**
   * Try to route a list / form / kanban path through the OWL ActionContainer.
   * Returns true when the OWL path was taken; false falls through to legacy renderers.
   *
   * @param {string} viewType  "list" | "form" | "kanban" | ...
   * @param {string} model     e.g. "res.partner"
   * @param {number|string|null} resId
   * @param {Object} [extraProps]
   * @returns {boolean}
   */
  function tryOwlRoute(viewType, model, resId, extraProps) {
    var AB = window.AppCore && window.AppCore.ActionBus;
    if (!AB || typeof AB.trigger !== "function") return false;
    if (!canMountOwl()) return false;

    var mountEl = typeof document !== "undefined" && document.getElementById("action-manager");
    if (!mountEl) return false;
    // CSP fallback shell: no real OWL views — always use legacy renderers.
    if (
      mountEl.matches("[data-erp-owl-fallback]") ||
      mountEl.querySelector("[data-erp-owl-fallback]")
    ) {
      return false;
    }
    // Check viewRegistry has a controller for this type
    var vr = window.AppCore && window.AppCore.viewRegistry;
    var desc = vr && typeof vr.get === "function" && vr.get(viewType);
    if (!desc) return false;

    AB.trigger("ACTION_MANAGER:UPDATE", Object.assign(
      { viewType: viewType, resModel: model, resId: resId || null },
      extraProps ? { props: extraProps } : {}
    ));
    return true;
  }

  /**
   * Parse an optional `domain=` query parameter from a route hash.
   * @param {string} [hashSlice] — hash without leading `#`; defaults to current location.
   * @returns {any[]}
   */
  function parseDomainFromHash(hashSlice) {
    var h = hashSlice != null ? String(hashSlice) : (window.location.hash || "").slice(1);
    var q = h.indexOf("?");
    if (q < 0) return [];
    var params = new URLSearchParams(h.slice(q + 1));
    var raw = params.get("domain");
    if (!raw) return [];
    var PU = window.__ERP_PARSE_UTILS || {};
    var parsed = PU.parseActionDomain ? PU.parseActionDomain(raw) : [];
    return Array.isArray(parsed) && parsed.length ? parsed : [];
  }

  var RouteEngine = {
    canMountOwl: canMountOwl,
    tryOwlRoute: tryOwlRoute,
    parseDomainFromHash: parseDomainFromHash,
  };

  window.__ERP_RouteEngine = RouteEngine;
  window.__ERP_tryOwlRoute = tryOwlRoute;
  window.__ERP_canMountOwl = canMountOwl;
})();
