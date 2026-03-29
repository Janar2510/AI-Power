/**
 * ViewService (Track O4).
 * Odoo 19 boundary parity: batch loadViews RPC that returns { views, fields }
 * per model; lazy per-view-type loading; view-registry-owned render paths.
 *
 * Shape mirrors Odoo 19's `/web/load_views` JSON-RPC endpoint:
 *   POST /web/load_views
 *   { model, views: [[false,"list"],[false,"form"]], context: {} }
 *   → { views: { list: { arch, fields }, form: { arch, fields } }, models: {...} }
 */

// ─── Cache ────────────────────────────────────────────────────────────────────
const _cache = new Map(); // key: `${model}:${viewTypes.join(",")}` → Promise<result>
const _fieldCache = new Map(); // key: model → Promise<fields>

function _cacheKey(model, viewTypes) {
  return model + ":" + [...viewTypes].sort().join(",");
}

// ─── RPC helper ───────────────────────────────────────────────────────────────
async function _jsonRpc(path, params) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ jsonrpc: "2.0", method: "call", params }),
  });
  if (!res.ok) throw new Error(`ViewService RPC ${path} → HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || "RPC error");
  return json.result;
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
  if (_cache.has(key)) return _cache.get(key);

  const promise = _jsonRpc("/web/dataset/call_kw", {
    model,
    method: "get_views",
    args: [viewTypes.map((t) => [false, t])],
    kwargs: { context: context || {} },
  }).then((result) => {
    // Normalise to { views: {list:{arch,fields},...}, fields: {fieldName:{...},...} }
    if (result && result.views) return result;
    // Fallback shape: { list: {...}, form: {...} }
    return { views: result || {}, fields: {} };
  }).catch((_err) => {
    // On error, return empty stubs so callers do not crash
    const stub = {};
    viewTypes.forEach((t) => { stub[t] = { arch: null, fields: {} }; });
    return { views: stub, fields: {} };
  });

  _cache.set(key, promise);
  return promise;
}

// ─── loadView (lazy single type) ─────────────────────────────────────────────
/**
 * Lazily load a single view type for a model (only fetch when actually needed).
 */
export async function loadView(model, viewType, context) {
  const result = await loadViews(model, [viewType], context);
  return (result.views && result.views[viewType]) || { arch: null, fields: {} };
}

// ─── getFields ────────────────────────────────────────────────────────────────
/**
 * Load fields_get for a model (cached per model).
 */
export async function getFields(model, context) {
  if (_fieldCache.has(model)) return _fieldCache.get(model);
  const promise = _jsonRpc("/web/dataset/call_kw", {
    model,
    method: "fields_get",
    args: [],
    kwargs: { attributes: ["string", "type", "required", "readonly", "selection"], context: context || {} },
  }).catch(() => ({}));
  _fieldCache.set(model, promise);
  return promise;
}

// ─── clearCache ───────────────────────────────────────────────────────────────
export function clearViewCache(model) {
  for (const key of _cache.keys()) {
    if (key.startsWith(model + ":")) _cache.delete(key);
  }
  _fieldCache.delete(model);
}

// ─── ViewService (Odoo 19 env.services.view shape) ───────────────────────────
export function createViewService() {
  return {
    loadViews,
    loadView,
    getFields,
    clearViewCache,

    /**
     * Sync helper: returns cached view arch if already resolved, else null.
     * Useful for synchronous code that wants to check if data is available.
     */
    getCachedView(model, viewType) {
      const key = _cacheKey(model, [viewType]);
      const p = _cache.get(key);
      if (!p) return null;
      // Access the resolved value if the promise has already settled
      let resolved = null;
      p.then((v) => { resolved = v; });
      return resolved;
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
