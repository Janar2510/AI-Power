/**
 * Modern bundle: read-only access to legacy route tables.
 * Authoritative maps live in `legacy_main_route_tables.js` + `legacy_main_route_resolve.js` (concat order before `main.js`).
 */

/** @returns {string} Pipe-separated slug regex source for data routes */
export function getDataRouteSlugs() {
  if (typeof window !== "undefined" && window.__ERP_ROUTE_LEGACY && window.__ERP_ROUTE_LEGACY.DATA_ROUTES_SLUGS) {
    return window.__ERP_ROUTE_LEGACY.DATA_ROUTES_SLUGS;
  }
  return "";
}

/** @returns {Record<string, unknown> | null} */
export function getRouteLegacy() {
  return typeof window !== "undefined" ? window.__ERP_ROUTE_LEGACY || null : null;
}
