/**
 * Post-1.249 Phase B: extension point for route handling before the monolithic
 * routeApplyInternal data-route branches. Modules register hooks via
 * registerBeforeDataRoutes(fn). fn(hash, base) returns true if it handled the route.
 */
(function () {
  window.AppCore = window.AppCore || {};
  var _before = [];

  window.AppCore.routeApplyRegistry = {
    registerBeforeDataRoutes(fn) {
      if (typeof fn === "function") {
        _before.push(fn);
      }
    },
    runBeforeDataRoutes(hash, base) {
      for (var i = 0; i < _before.length; i += 1) {
        try {
          if (_before[i](hash, base)) {
            return true;
          }
        } catch (_e) {
          /* ignore plugin errors */
        }
      }
      return false;
    },
  };
})();
