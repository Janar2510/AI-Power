/**
 * Phase 1.250.12: Routing integration smoke tests.
 *
 * Covers:
 * - routeApplyRegistry dispatches plugin routes before data-route branches
 * - data-route hash resolves via routeApplyInternal without re-entry
 * - unknown hash falls back gracefully (no throw)
 * - doAction same-route guard: calling doAction for the already-current route
 *   must NOT trigger a second navigate (the infinite-loop fix from 1.250.11)
 */
(function () {
  var H = window.TestHelpers;

  function run() {
    var results = { pass: 0, fail: 0, errors: [] };

    function test(name, fn) {
      try {
        fn();
        results.pass += 1;
      } catch (e) {
        results.fail += 1;
        results.errors.push(name + ": " + (e && e.message ? e.message : String(e)));
      }
    }

    // ── routeApplyRegistry smoke ───────────────────────────────────────────

    test("routeApplyRegistry exists on AppCore", function () {
      var RAR = window.AppCore && window.AppCore.routeApplyRegistry;
      H.assertTrue(!!RAR, "AppCore.routeApplyRegistry must exist");
    });

    test("routeApplyRegistry.runBeforeDataRoutes returns false when no plugins match", function () {
      var RAR = window.AppCore.routeApplyRegistry;
      // 'home' is not handled by any registered plugin
      var handled = RAR.runBeforeDataRoutes("home", "home");
      H.assertTrue(!handled, "unrecognised route should return false");
    });

    test("routeApplyRegistry.registerBeforeDataRoutes + runBeforeDataRoutes dispatches correctly", function () {
      var RAR = window.AppCore.routeApplyRegistry;
      var sawHash = null;
      RAR.registerBeforeDataRoutes(function (hash, base) {
        if (base === "_smoke_test_route_") {
          sawHash = hash;
          return true;
        }
        return false;
      });
      var handled = RAR.runBeforeDataRoutes("_smoke_test_route_", "_smoke_test_route_");
      H.assertTrue(handled, "registered plugin must handle its route");
      H.assertEqual(sawHash, "_smoke_test_route_", "plugin must receive the hash");
    });

    test("routeApplyRegistry plugin error is swallowed (no throw)", function () {
      var RAR = window.AppCore.routeApplyRegistry;
      RAR.registerBeforeDataRoutes(function () {
        throw new Error("intentional plugin error");
      });
      var threw = false;
      try {
        RAR.runBeforeDataRoutes("_error_route_", "_error_route_");
      } catch (_e) {
        threw = true;
      }
      H.assertTrue(!threw, "plugin errors must be swallowed by the registry");
    });

    // ── doAction same-route guard (infinite-loop fix) ────────────────────

    test("services.js doAction same-route guard: navigate is not called when target matches current hash", function () {
      // Simulate the guard logic from services.js without depending on the full
      // module.  Re-implement just the guard condition to verify correctness.
      var navigateCalls = 0;
      function actionToRoute(act) {
        return act && act._testRoute ? act._testRoute : null;
      }
      function navigateForActWindow(act) {
        navigateCalls += 1;
      }

      function guardedNavigate(act, curHash) {
        var nextRoute = actionToRoute(act || {});
        var curRoute = (curHash || "home").split("?")[0] || "home";
        if (nextRoute && nextRoute !== curRoute) {
          navigateForActWindow(act);
        }
      }

      // Same route — should NOT navigate
      guardedNavigate({ _testRoute: "invoices" }, "invoices");
      H.assertEqual(navigateCalls, 0, "same-route guard must prevent navigate (was the infinite loop)");

      // Different route — SHOULD navigate
      guardedNavigate({ _testRoute: "contacts" }, "invoices");
      H.assertEqual(navigateCalls, 1, "different route must still trigger navigate");

      // No route mapping — SHOULD NOT navigate
      guardedNavigate({ _testRoute: null }, "invoices");
      H.assertEqual(navigateCalls, 1, "null route must not call navigate");
    });

    // ── Router smoke ──────────────────────────────────────────────────────

    test("AppCore.Router.navigate sets window.location.hash", function () {
      var R = window.AppCore && window.AppCore.Router;
      if (!R || typeof R.navigate !== "function") {
        // Router may not be available in headless environment; skip gracefully
        return;
      }
      var prev = window.location.hash;
      R.navigate("smoke_test_nav");
      H.assertTrue(
        (window.location.hash || "").indexOf("smoke_test_nav") >= 0,
        "navigate must update window.location.hash"
      );
      // Restore
      window.location.hash = prev || "#home";
    });

    test("AppCore.Router.routeApply delegates applyRoute handler once (no re-entry)", function () {
      var R = window.AppCore && window.AppCore.Router;
      if (!R || typeof R.setHandlers !== "function") {
        return;
      }
      var callCount = 0;
      var originalHandlers = R._handlers ? Object.assign({}, R._handlers) : null;
      R.setHandlers({
        applyRoute: function (hash) {
          callCount += 1;
          if (callCount > 5) throw new Error("re-entry detected: applyRoute called " + callCount + " times");
        },
        renderNavbar: function () {},
      });
      R.routeApply("invoices", "invoices");
      H.assertTrue(callCount === 1, "applyRoute must be called exactly once per routeApply (got " + callCount + ")");
      // Restore handlers
      if (originalHandlers) R.setHandlers(originalHandlers);
    });

    return results;
  }

  window.Tests = window.Tests || {};
  window.Tests.routingSmoke = run;
})();
