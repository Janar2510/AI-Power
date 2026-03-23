(function () {
  var H = window.TestHelpers;
  var R = window.AppCore && window.AppCore.Router;

  function run() {
    var results = { pass: 0, fail: 0, errors: [] };
    function test(name, fn) {
      try {
        fn();
        results.pass += 1;
      } catch (e) {
        results.fail += 1;
        results.errors.push(name + ": " + e.message);
      }
    }

    if (!R) {
      results.fail += 1;
      results.errors.push("AppCore.Router not found");
      return results;
    }

    test("state set/get", function () {
      R.setState({ dirty: true, lastHash: "contacts" });
      var s = R.getState();
      H.assertTrue(!!s.dirty);
      H.assertEqual(s.lastHash, "contacts");
    });

    test("breadcrumbs render", function () {
      R.breadcrumbs = [];
      R.pushBreadcrumb("Home", "home");
      R.pushBreadcrumb("Contacts", "contacts");
      var html = R.renderBreadcrumbs();
      H.assertTrue(html.indexOf("Contacts") >= 0);
    });

    test("navigate writes hash", function () {
      var route = R.navigate("pipeline");
      H.assertEqual(route, "pipeline");
      H.assertTrue((window.location.hash || "").indexOf("pipeline") >= 0);
    });

    return results;
  }

  window.Tests = window.Tests || {};
  window.Tests.router = run;
})();
