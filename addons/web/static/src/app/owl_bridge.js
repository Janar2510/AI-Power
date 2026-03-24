export function getOwl() {
  if (!window.owl) {
    throw new Error("OWL runtime missing. Expected /web/static/lib/owl/owl.js before the modern webclient bundle.");
  }
  return window.owl;
}

export function mountComponent(ComponentClass, target, config) {
  const owl = getOwl();
  return owl.mount(ComponentClass, target, config || {});
}
