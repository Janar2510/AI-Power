(function () {
  var H = window.TestHelpers;
  var W = window.FieldWidgets;

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

    if (!W || typeof W.render !== "function") {
      results.fail += 1;
      results.errors.push("FieldWidgets.render not found");
      return results;
    }

    var api = {
      getFieldLabel: function (_m, n) { return n; },
      getSelectionOptions: function () { return [["a", "A"], ["b", "B"]]; },
    };
    ["priority", "state_selection", "handle", "email", "url", "phone", "copy_clipboard", "float_time", "radio", "many2many_checkboxes"].forEach(function (widget) {
      test("render " + widget, function () {
        var html = W.render("res.partner", { name: "x_" + widget, widget: widget }, api);
        H.assertTrue(typeof html === "string" && html.length > 0, "html should be generated");
      });
    });

    test("priority uses o-priority-widget token class", function () {
      var h = W.render("res.partner", { name: "prio", widget: "priority" }, api);
      H.assertTrue(h.indexOf("o-priority-widget") >= 0 && h.indexOf("o-priority-star") >= 0);
    });

    test("state_selection uses o-state-selection-select", function () {
      var h = W.render("res.partner", { name: "st", widget: "state_selection" }, api);
      H.assertTrue(h.indexOf("o-state-selection-select") >= 0);
    });

    return results;
  }

  window.Tests = window.Tests || {};
  window.Tests.field_registry = run;
})();
