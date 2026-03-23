(function () {
  var H = window.TestHelpers;
  var F = window.AppCore && window.AppCore.FormView;

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

    if (!F || typeof F.setImpl !== "function") {
      results.fail += 1;
      results.errors.push("AppCore.FormView not found");
      return results;
    }

    test("renderFieldHtml delegates to impl", function () {
      F.setImpl({
        renderFieldHtml: function () { return "<p>x</p>"; },
      });
      H.assertEqual(F.renderFieldHtml("x", { name: "name" }), "<p>x</p>");
    });

    test("render delegates to impl", function () {
      var handled = false;
      F.setImpl({
        render: function () { handled = true; return true; },
      });
      var el = H.createContainer();
      try {
        var ok = F.render(el, { model: "res.partner", route: "contacts" });
        H.assertTrue(ok);
        H.assertTrue(handled);
      } finally {
        H.removeContainer(el);
      }
    });

    return results;
  }

  window.Tests = window.Tests || {};
  window.Tests.form_view = run;
})();
