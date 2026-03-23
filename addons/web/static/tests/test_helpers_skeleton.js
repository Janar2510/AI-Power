(function () {
  var H = window.TestHelpers;
  var Helpers = window.AppCore && window.AppCore.Helpers;

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

    test("helpers module exists", function () {
      H.assertTrue(!!Helpers);
      H.assertTrue(typeof Helpers.renderSkeletonHtml === "function");
    });

    test("renderSkeletonHtml creates requested lines", function () {
      var html = Helpers.renderSkeletonHtml(4, true);
      H.assertTrue(html.indexOf("o-ai-skeleton-wrap") >= 0);
      var count = (html.match(/o-ai-skeleton-line/g) || []).length;
      H.assertEqual(count, 4);
    });

    return Promise.resolve(results);
  }

  window.Tests = window.Tests || {};
  window.Tests.helpers_skeleton = run;
})();
