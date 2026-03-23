(function () {
  var H = window.TestHelpers;
  var Systray = window.Services && window.Services.systray;

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

    test("systray service exists", function () {
      H.assertTrue(!!Systray);
      H.assertTrue(typeof Systray.add === "function");
      H.assertTrue(typeof Systray.renderAll === "function");
    });

    test("systray items render in sequence order", function () {
      Systray.add("z_item", { sequence: 50, render: function () { return "<span>Z</span>"; } });
      Systray.add("a_item", { sequence: 10, render: function () { return "<span>A</span>"; } });
      var html = Systray.renderAll({});
      H.assertTrue(html.indexOf("<span>A</span>") < html.indexOf("<span>Z</span>"));
    });

    return Promise.resolve(results);
  }

  window.Tests = window.Tests || {};
  window.Tests.systray_registry = run;
})();
