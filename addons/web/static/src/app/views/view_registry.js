/**
 * View descriptor registry (Track J1).
 * Odoo 19 boundary parity: typed view descriptor, validation, category("views") registration.
 * View descriptors have: { type, Controller, Renderer, Model, ArchParser, props, searchMenuTypes }
 *
 * Integrates with both the modular env.registries (ESM) and the legacy window.Services.viewRegistry
 * (concat bundle) so both paths can resolve view types.
 */

const VALID_VIEW_TYPES = new Set([
  "list", "form", "kanban", "graph", "pivot", "calendar", "gantt", "activity",
  "search", "map", "hierarchy", "cohort", "grid",
]);

/**
 * Validate a view descriptor matches expected shape.
 * Throws if the descriptor is invalid.
 * @param {string} type
 * @param {object} descriptor
 */
function validateDescriptor(type, descriptor) {
  if (!descriptor || typeof descriptor !== "object") {
    throw new Error(`[view_registry] Descriptor for "${type}" must be an object.`);
  }
  if (descriptor.type && descriptor.type !== type) {
    throw new Error(
      `[view_registry] Descriptor.type "${descriptor.type}" does not match registry key "${type}".`
    );
  }
  if (descriptor.Controller && typeof descriptor.Controller !== "function") {
    throw new Error(`[view_registry] Descriptor.Controller for "${type}" must be a class/function.`);
  }
  if (descriptor.Renderer && typeof descriptor.Renderer !== "function") {
    throw new Error(`[view_registry] Descriptor.Renderer for "${type}" must be a class/function.`);
  }
}

/**
 * createViewRegistry() — returns a typed registry for view descriptors.
 */
export function createViewRegistry() {
  const _entries = new Map();
  const _listeners = new Set();

  function notify() {
    _listeners.forEach((fn) => fn(_entries));
  }

  const registry = {
    /**
     * Register a view descriptor.
     * @param {string} type — view type key, e.g. "list", "form"
     * @param {object} descriptor — { type?, Controller, Renderer?, Model?, ArchParser?, searchMenuTypes?, ... }
     * @returns {object} the descriptor
     */
    add(type, descriptor) {
      validateDescriptor(type, descriptor);
      const entry = Object.assign({ type }, descriptor);
      _entries.set(type, entry);
      notify();
      return entry;
    },

    /**
     * Retrieve a registered view descriptor.
     * @param {string} type
     * @returns {object|undefined}
     */
    get(type) {
      return _entries.get(String(type || ""));
    },

    has(type) {
      return _entries.has(String(type || ""));
    },

    getAll() {
      return Array.from(_entries.values());
    },

    getEntries() {
      return Array.from(_entries.entries());
    },

    subscribe(fn) {
      _listeners.add(fn);
      return () => _listeners.delete(fn);
    },
  };

  return registry;
}

/**
 * Global singleton view registry for the modular bundle.
 * Also assigned to window.Services.viewRegistry for concat-bundle access.
 */
export const viewRegistry = createViewRegistry();

// Sync to legacy concat-bundle registry reference
if (typeof window !== "undefined") {
  window.Services = window.Services || {};
  // Only seed if no existing viewRegistry (or replace a plain object)
  if (!window.Services.viewRegistry || !window.Services.viewRegistry.add) {
    window.Services.viewRegistry = viewRegistry;
  }
}

/**
 * Register a view type using `env.registries.category("views")`.
 * Accepts a full descriptor or maps the legacy module-based resolver.
 * @param {object} env
 * @param {string} type
 * @param {object} descriptor
 */
export function registerView(env, type, descriptor) {
  validateDescriptor(type, descriptor);
  const entry = Object.assign({ type }, descriptor);
  // Register in env.registries for OWL / modular path
  if (env && env.registries) {
    env.registries.category("views").add(type, entry);
  }
  // Also register in global singleton for legacy concat access
  viewRegistry.add(type, entry);
  return entry;
}

/**
 * resolveViewDescriptor(type) — resolves a view descriptor from the registry.
 * Falls back to the legacy __ERP_ViewResolver module pattern.
 * @param {string} type
 * @param {object} [env]
 * @returns {object|null}
 */
export function resolveViewDescriptor(type, env) {
  const key = String(type || "list");

  // 1. env.registries (modular)
  if (env && env.registries) {
    const entry = env.registries.category("views").get(key);
    if (entry) return entry;
  }

  // 2. global singleton
  const entry = viewRegistry.get(key);
  if (entry) return entry;

  // 3. legacy __ERP_ViewResolver (concat bundle)
  if (window.__ERP_ViewResolver && typeof window.__ERP_ViewResolver.resolve === "function") {
    const resolved = window.__ERP_ViewResolver.resolve({ view_mode: key });
    if (resolved && resolved.module) {
      return { type: key, module: resolved.module, entry: resolved.entry };
    }
  }

  return null;
}

window.AppCore = window.AppCore || {};
window.AppCore.viewRegistry = viewRegistry;
window.AppCore.resolveViewDescriptor = resolveViewDescriptor;
window.AppCore.registerView = registerView;
