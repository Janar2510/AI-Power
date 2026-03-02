/**
 * Service registry - get services by name
 */
(function () {
  const registry = {
    get(name) {
      const s = (window.Services || {})[name];
      if (!s) throw new Error('Service not found: ' + name);
      return s;
    },
    has(name) {
      return !!(window.Services && window.Services[name]);
    }
  };
  window.Services = window.Services || {};
  window.Services.registry = registry;
})();
