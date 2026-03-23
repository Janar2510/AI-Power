(function () {
  var H = window.TestHelpers;
  var Onboarding = window.UIComponents && window.UIComponents.OnboardingPanel;

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

    test("onboarding component exists", function () {
      H.assertTrue(!!Onboarding);
      H.assertTrue(typeof Onboarding.renderHTML === "function");
      H.assertTrue(typeof Onboarding.wire === "function");
    });

    test("renderHTML includes steps and progress", function () {
      var html = Onboarding.renderHTML({
        storageKey: "test",
        steps: [
          { title: "A", done: true },
          { title: "B", done: false },
        ],
      });
      H.assertTrue(html.indexOf("2 complete") < 0);
      H.assertTrue(html.indexOf("1/2 complete") >= 0);
      H.assertTrue(html.indexOf("o-onboarding-step") >= 0);
    });

    return Promise.resolve(results);
  }

  window.Tests = window.Tests || {};
  window.Tests.onboarding_panel = run;
})();
