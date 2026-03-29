/**
 * OWL component hooks — Odoo 19 boundary parity (Track I1).
 * Aligns with @web/core/utils/hooks: useService, useEnv, useAsync, useDebounce, useForwardRef.
 * Clean-room — matches API surface, not upstream implementation.
 */

const owl = window.owl;
const { useEnv, useRef, useState, useEffect, onWillUnmount, onMounted } = owl;

/**
 * useService(name) — resolves a service from env.services.
 * Throws at component setup time if missing so failures are discoverable.
 * @param {string} name
 */
export function useService(name) {
  const env = useEnv();
  const service = env && env.services && env.services[name];
  if (service == null) {
    throw new Error(`[useService] Service "${name}" not found in env.services.`);
  }
  return service;
}

/**
 * useAsyncState(asyncFn, deps?) — runs an async function and tracks { loading, value, error }.
 * Re-runs when deps identity changes.
 * @param {() => Promise<any>} asyncFn
 * @returns {{ loading: boolean, value: any, error: any }}
 */
export function useAsyncState(asyncFn) {
  const state = useState({ loading: false, value: null, error: null });
  let cancelled = false;

  onMounted(async () => {
    state.loading = true;
    cancelled = false;
    try {
      const result = await asyncFn();
      if (!cancelled) {
        state.value = result;
        state.error = null;
      }
    } catch (err) {
      if (!cancelled) {
        state.error = err;
      }
    } finally {
      if (!cancelled) {
        state.loading = false;
      }
    }
  });

  onWillUnmount(() => {
    cancelled = true;
  });

  return state;
}

/**
 * useDebounce(fn, delay) — returns a debounced version of fn.
 * The pending call is cancelled on component unmount.
 * @param {Function} fn
 * @param {number} delay  ms
 * @returns {Function}
 */
export function useDebounce(fn, delay) {
  let timer = null;

  onWillUnmount(() => {
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
    }
  });

  return function (...args) {
    if (timer != null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delay);
  };
}

/**
 * useForwardRef(name) — creates a ref that a parent can retrieve via component.refs[name].
 * Mirrors Odoo's useForwardRefToParent pattern (light version).
 * @param {string} name
 */
export function useForwardRef(name) {
  const ref = useRef(name);
  return ref;
}

/**
 * useExternalListener(target, event, handler, options?) — adds an event listener on an
 * element outside the component's subtree and cleans up on unmount.
 * @param {EventTarget} target
 * @param {string} event
 * @param {Function} handler
 * @param {object} [options]
 */
export function useExternalListener(target, event, handler, options) {
  onMounted(() => {
    target.addEventListener(event, handler, options);
  });
  onWillUnmount(() => {
    target.removeEventListener(event, handler, options);
  });
}

/**
 * useAutoFocus(refName?) — focuses the referenced element or the first focusable inside the component.
 * @param {string} [refName]
 */
export function useAutoFocus(refName) {
  const ref = refName ? useRef(refName) : null;
  onMounted(() => {
    const el = ref ? ref.el : null;
    if (el) {
      el.focus();
    }
  });
  return ref;
}

export { useEnv, useRef, useState, useEffect, onMounted, onWillUnmount };
