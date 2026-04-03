/**
 * ViewService (Track O4).
 * Odoo 19 boundary parity: batch loadViews that returns { views, fields }
 * per model; lazy per-view-type loading; view-registry-owned render paths.
 *
 * Implementation uses the existing GET /web/load_views endpoint which already
 * returns { views, fields_meta, menus, actions } populated from the DB or XML
 * registry. The ORM `get_views` method referenced in prior versions does not
 * exist on the server; calls were silently degrading to empty stubs.
 *
 * getCachedView now correctly stores resolved values in a synchronous Map so
 * callers that call it after the Promise settles receive real data.
 */

// ─── Resolved-value caches ────────────────────────────────────────────────────
const _promiseCache = new Map();   // key → Promise<registryResult>
const _resolvedCache = new Map();  // key → resolved registryResult (sync access)
const _fieldCache = new Map();     // model → Promise<fields>
const _fieldResolvedCache = new Map(); // model → resolved fields (sync access)

// Singleton: one /web/load_views fetch per page load (the endpoint returns all models)
let _globalRegistryPromise = null;
let _globalRegistryResolved = null;

function _cacheKey(model, viewTypes) {
  return model + ":" + [...viewTypes].sort().join(",");
}

// ─── RPC helper ───────────────────────────────────────────────────────────────
const VIEWS_RPC_FETCH_MS = 20000;

async function _jsonRpc(path, params) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const tid = setTimeout(function () {
    if (controller) try { controller.abort(); } catch (_e) { /* noop */ }
  }, VIEWS_RPC_FETCH_MS);
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ jsonrpc: "2.0", method: "call", params }),
      signal: controller ? controller.signal : undefined,
    });
    if (!res.ok) throw new Error(`ViewService RPC ${path} → HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message || "RPC error");
    return json.result;
  } finally {
    clearTimeout(tid);
  }
}

// ─── Load global registry (once per session) ─────────────────────────────────
/**
 * Fetch the full /web/load_views registry. Result is a superset that contains
 * { views: { "model": { list: { arch, fields }, ... } }, fields_meta, menus, actions }.
 * Cached globally — second call returns the same Promise.
 */
function _loadGlobalRegistry() {
  if (_globalRegistryPromise) return _globalRegistryPromise;
  _globalRegistryPromise = (async () => {
    // Prefer window.Services.views (legacy) if already loaded — it uses the same endpoint
    const legacySvc = window.Services && window.Services.views;
    if (legacySvc && typeof legacySvc.getAll === "function") {
      try {
        const reg = legacySvc.getAll();
        if (reg && reg.views) {
          _globalRegistryResolved = reg;
          return reg;
        }
      } catch (_e) { /* fall through */ }
    }

    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const tid = setTimeout(() => {
      if (controller) try { controller.abort(); } catch (_e) { /* noop */ }
    }, VIEWS_RPC_FETCH_MS);
    try {
      const res = await fetch("/web/load_views", {
        method: "GET",
        credentials: "include",
        signal: controller ? controller.signal : undefined,
      });
      if (!res.ok) throw new Error(`/web/load_views → HTTP ${res.status}`);
      const reg = await res.json();
      _globalRegistryResolved = reg;
      return reg;
    } finally {
      clearTimeout(tid);
    }
  })().catch((_err) => {
    _globalRegistryPromise = null; // allow retry on next call
    _globalRegistryResolved = null;
    return { views: {}, fields_meta: {}, menus: [], actions: {} };
  });
  return _globalRegistryPromise;
}

// ─── loadViews (batch) ────────────────────────────────────────────────────────
/**
 * Batch-load view architectures + fields for a model.
 *
 * @param {string} model e.g. "res.partner"
 * @param {string[]} viewTypes e.g. ["list","form"]
 * @param {Object} [context]
 * @returns {Promise<{views: Object, fields: Object}>}
 */
export async function loadViews(model, viewTypes, context) {
  const key = _cacheKey(model, viewTypes);
  if (_promiseCache.has(key)) return _promiseCache.get(key);

  const promise = _loadGlobalRegistry().then((reg) => {
    const allModelViews = (reg.views && reg.views[model]) || {};
    const fields = (reg.fields_meta && reg.fields_meta[model]) || {};
    const views = {};
    viewTypes.forEach((t) => {
      views[t] = allModelViews[t] || { arch: null, fields: {} };
    });
    const result = { views, fields };
    _resolvedCache.set(key, result);
    return result;
  }).catch((_err) => {
    const stub = {};
    viewTypes.forEach((t) => { stub[t] = { arch: null, fields: {} }; });
    return { views: stub, fields: {} };
  });

  _promiseCache.set(key, promise);
  return promise;
}

// ─── loadView (lazy single type) ─────────────────────────────────────────────
export async function loadView(model, viewType, context) {
  const result = await loadViews(model, [viewType], context);
  return (result.views && result.views[viewType]) || { arch: null, fields: {} };
}

// ─── getFields ────────────────────────────────────────────────────────────────
/**
 * Load fields_get for a model (cached per model).
 * Falls back to fields_meta from the global registry when RPC fails.
 */
export async function getFields(model, context) {
  if (_fieldCache.has(model)) return _fieldCache.get(model);
  const promise = _jsonRpc("/web/dataset/call_kw", {
    model,
    method: "fields_get",
    args: [],
    kwargs: { attributes: ["string", "type", "required", "readonly", "selection"], context: context || {} },
  }).then((fields) => {
    _fieldResolvedCache.set(model, fields);
    return fields;
  }).catch(async () => {
    // Fallback to fields_meta from the cached registry
    const reg = _globalRegistryResolved || await _loadGlobalRegistry();
    const fallback = (reg && reg.fields_meta && reg.fields_meta[model]) || {};
    _fieldResolvedCache.set(model, fallback);
    return fallback;
  });
  _fieldCache.set(model, promise);
  return promise;
}

// ─── clearCache ───────────────────────────────────────────────────────────────
export function clearViewCache(model) {
  for (const key of _promiseCache.keys()) {
    if (key.startsWith(model + ":")) {
      _promiseCache.delete(key);
      _resolvedCache.delete(key);
    }
  }
  _fieldCache.delete(model);
  _fieldResolvedCache.delete(model);
}

// ─── ViewService (Odoo 19 env.services.view shape) ───────────────────────────
export function createViewService() {
  return {
    loadViews,
    loadView,
    getFields,
    clearViewCache,

    /**
     * Sync helper: returns cached view result if already resolved, else null.
     * Fixed from prior version — resolves by storing in _resolvedCache after
     * the Promise settles rather than capturing the value before the `.then()`.
     */
    getCachedView(model, viewType) {
      const key = _cacheKey(model, [viewType]);
      const resolved = _resolvedCache.get(key);
      if (!resolved) return null;
      return (resolved.views && resolved.views[viewType]) || null;
    },

    /** Expose full resolved registry for legacy Services.views compatibility. */
    getAll() {
      return _globalRegistryResolved;
    },
  };
}

// ─── Register on window.Services ─────────────────────────────────────────────
window.Services = window.Services || {};
if (!window.Services.viewService) {
  window.Services.viewService = createViewService();
}

window.AppCore = window.AppCore || {};
window.AppCore.ViewService = window.Services.viewService;
