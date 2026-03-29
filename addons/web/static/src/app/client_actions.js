/**
 * Client action registry (Track K3).
 * Registers settings, discuss, dashboard, import, and debug as registry.category("actions") entries.
 * Legacy concat-bundle Services.action._clientRegistry is seeded in parallel via registerClientAction.
 *
 * Tag contract: matches Odoo 19's xml_id-based client action tags.
 */

/**
 * Navigate to a hash route and return a handled result.
 */
function hashAction(hash) {
  return function navAction(_def, _options) {
    window.location.hash = hash.startsWith("#") ? hash : "#" + hash;
    return { type: "client", tag: hash, handled: true };
  };
}

/**
 * Open a URL (internal or external).
 */
function urlAction(url, target) {
  return function openAction(_def, _options) {
    if (target === "_blank") {
      window.open(url, "_blank", "noopener");
    } else {
      window.location.href = url;
    }
    return { type: "client", url: url, handled: true };
  };
}

/** Built-in client actions. Tags match legacy action.registerClientAction keys. */
const BUILTIN_CLIENT_ACTIONS = {
  // Navigation
  "home": hashAction("home"),
  "web.home": hashAction("home"),
  "reload": function () { window.location.reload(); return { handled: true }; },
  "web.reload": function () { window.location.reload(); return { handled: true }; },

  // Shell destinations
  "settings": hashAction("settings"),
  "base_setup.action_general_configuration": hashAction("settings"),
  "discuss": hashAction("discuss"),
  "mail.action_discuss": hashAction("discuss"),
  "dashboard": hashAction("home"),
  "web.action_base_dashboard": hashAction("home"),

  // Import
  "import": function (def) {
    const model = (def && (def.context && def.context.model)) || (def && def.params && def.params.model) || null;
    const hash = model ? "import/" + String(model).replace(/\./g, "_") : "import";
    window.location.hash = "#" + hash;
    return { type: "client", tag: "import", handled: true };
  },
  "base_import.action_base_import": function (def) {
    const model = def && def.params && def.params.model;
    const hash = model ? "import/" + String(model).replace(/\./g, "_") : "import";
    window.location.hash = "#" + hash;
    return { type: "client", tag: "import", handled: true };
  },

  // Debug
  "web.action_base_debug_log": function () {
    window.location.hash = "#debug";
    return { handled: true };
  },
};

/**
 * Register all built-in client actions into:
 * 1. env.registries.category("actions") — the modular registry
 * 2. window.Services.action — the legacy concat-bundle registry
 */
export function registerBuiltinClientActions(env) {
  const registries = env && env.registries;
  const legacyAction = window.Services && window.Services.action;

  Object.entries(BUILTIN_CLIENT_ACTIONS).forEach(([tag, fn]) => {
    // Modular registry
    if (registries) {
      try {
        registries.category("actions").add(tag, fn);
      } catch (_e) { /* already registered */ }
    }
    // Legacy registry
    if (legacyAction && typeof legacyAction.registerClientAction === "function") {
      legacyAction.registerClientAction(tag, fn);
    }
  });
}

/**
 * Register a custom client action at runtime.
 * @param {string} tag
 * @param {Function} fn — (actionDef, options) => result
 * @param {object} [env]
 */
export function registerClientAction(tag, fn, env) {
  if (!tag || typeof fn !== "function") return;
  BUILTIN_CLIENT_ACTIONS[tag] = fn;
  const registries = env && env.registries;
  if (registries) {
    registries.category("actions").add(tag, fn);
  }
  const legacyAction = window.Services && window.Services.action;
  if (legacyAction && typeof legacyAction.registerClientAction === "function") {
    legacyAction.registerClientAction(tag, fn);
  }
}

window.AppCore = window.AppCore || {};
window.AppCore.registerClientAction = registerClientAction;
window.AppCore.BUILTIN_CLIENT_ACTIONS = BUILTIN_CLIENT_ACTIONS;

export { BUILTIN_CLIENT_ACTIONS };
