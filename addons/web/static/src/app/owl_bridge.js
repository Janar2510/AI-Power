export function getOwl() {
  if (!window.owl) {
    throw new Error("OWL runtime missing. Expected /web/static/lib/owl/owl.js before the modern webclient bundle.");
  }
  return window.owl;
}

/**
 * Server sets __erpFrontendBootstrap.cspScriptEvalBlocked from enforcing CSP (no unsafe-eval).
 * Avoids a client-side `new Function` probe that would itself violate CSP / Trusted Types.
 */
function cspScriptEvalBlocked() {
  const b = typeof window !== "undefined" && window.__erpFrontendBootstrap;
  if (b && b.cspScriptEvalBlocked === false) {
    return false;
  }
  return true;
}

function fallbackMount(ComponentClass, target, config, error) {
  if (!ComponentClass || typeof ComponentClass.fallbackMount !== "function") {
    throw error;
  }
  if (typeof console !== "undefined" && console.warn) {
    console.warn(
      "[modern-webclient] Falling back to CSP-safe shell mount for",
      ComponentClass && ComponentClass.name ? ComponentClass.name : "anonymous-component",
      error
    );
  }
  if (target) {
    target.innerHTML = "";
  }
  return ComponentClass.fallbackMount((config && config.env) || null, target, error);
}

export function mountComponent(ComponentClass, target, config) {
  const cfg = config || {};
  if (
    ComponentClass &&
    typeof ComponentClass.fallbackMount === "function" &&
    cspScriptEvalBlocked()
  ) {
    return Promise.resolve(ComponentClass.fallbackMount(cfg.env || null, target));
  }
  try {
    const owl = getOwl();
    return Promise.resolve(owl.mount(ComponentClass, target, cfg)).catch(function (error) {
      return fallbackMount(ComponentClass, target, cfg, error);
    });
  } catch (error) {
    return Promise.resolve(fallbackMount(ComponentClass, target, cfg, error));
  }
}
